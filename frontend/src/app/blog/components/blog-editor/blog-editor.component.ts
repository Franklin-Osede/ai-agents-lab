import { Component, inject, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../shared/services/supabase.service';
import { BlogService } from '../../services/blog.service';
import { BlogPostStatus, BLOG_AUTHORS, CreateBlogPostDto } from '../../models/blog.model';

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TipTapImage from '@tiptap/extension-image';
import FloatingMenu from '@tiptap/extension-floating-menu';
import TextAlign from '@tiptap/extension-text-align';
import TipTapLink from '@tiptap/extension-link';
import { Node, mergeAttributes } from '@tiptap/core';

export const LeadMagnetNode = Node.create({
  name: 'leadMagnet',
  group: 'block',
  atom: true, 
  parseHTML() { return [{ tag: 'div[data-type="lead-magnet"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'lead-magnet', 'class': 'bg-slate-50 border-l-4 border-clinical-blue p-6 my-8 rounded relative group shadow-sm transition-all hover:ring-2 hover:ring-clinical-blue/20 cursor-pointer' }),
      ['div', { class: 'absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow text-xs font-bold leading-none select-none z-10', 'title': 'Seleccionar para borrar: Presiona Backspace' }, '×'],
      ['h3', { class: 'mt-0 mb-2 text-clinical-blue font-sans font-bold text-lg' }, 'Descarga Gratis: Guía de IA'],
      ['p', { class: 'font-sans text-sm text-slate-600 mb-4' }, 'Aprende cómo automatizar tu recepción y ahorrar un 40% en costes operativos.'],
      ['button', { class: 'bg-clinical-blue text-white px-4 py-2 rounded font-bold text-sm pointer-events-none' }, 'Descargar Whitepaper']
    ]
  },
})

export const DemoSchedulerNode = Node.create({
  name: 'demoScheduler',
  group: 'block',
  atom: true,
  parseHTML() { return [{ tag: 'div[data-type="demo-scheduler"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'demo-scheduler', 'class': 'bg-white border-2 border-slate-200 rounded-xl p-8 text-center my-8 shadow-sm group relative transition-all hover:ring-2 hover:ring-slate-900/20 cursor-pointer' }),
      ['div', { class: 'absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow text-xs font-bold leading-none select-none z-10', 'title': 'Seleccionar para borrar: Presiona Backspace' }, '×'],
      ['h3', { class: 'mt-0 mb-2 font-sans text-xl font-bold text-slate-800' }, '¿Listo para automatizar tu clínica?'],
      ['p', { class: 'font-sans text-sm text-slate-500 mb-6 font-medium' }, 'Agenda una demostración sin compromiso con nuestros expertos en IA.'],
      ['button', { class: 'bg-slate-900 text-white px-6 py-3 rounded-lg font-bold text-sm pointer-events-none' }, 'Reservar Demo']
    ]
  },
})

@Component({
  selector: 'app-blog-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './blog-editor.component.html',
  styleUrls: ['./blog-editor.component.css']
})
export class BlogEditorComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private blogService = inject(BlogService);

  title = '';
  content = '';
  coverImage = '';
  coverImageAlt = '';
  targetKeyword = '';
  authors = BLOG_AUTHORS;
  selectedAuthorId = '';

  // Custom Prompt Modal State
  showPromptModal = false;
  promptTitle = '';
  promptValue = '';
  private promptResolver: ((value: string | null) => void) | null = null;

  // State
  isSaving = false;

  // Metrics
  wordCount = 0;
  healthScore = 0; 
  keywordDensity = 0;
  hasH1H2 = false;
  seoSuggestions: string[] = [];

  lsiTerms = [
    { term: 'automatización', present: false },
    { term: 'recepción', present: false },
    { term: 'agendar citas', present: false },
    { term: 'ahorro costes', present: false },
  ];

  @ViewChild('editorContainer') editorContainer!: ElementRef;
  @ViewChild('floatingMenu') floatingMenu!: ElementRef;
  editor!: Editor;

  ngAfterViewInit() {
    this.editor = new Editor({
      element: this.editorContainer.nativeElement,
      extensions: [
        StarterKit,
        FloatingMenu.configure({
          element: this.floatingMenu.nativeElement
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph', 'image']
        }),
        TipTapLink.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-clinical-blue underline font-medium cursor-pointer'
          }
        }),
        LeadMagnetNode,
        DemoSchedulerNode,
        TipTapImage.configure({
          inline: true,
          HTMLAttributes: {
             class: 'rounded-xl shadow block my-4 max-w-full'
          }
        })
      ],
      content: '', // Starts empty
      onUpdate: ({ editor }) => {
        this.content = editor.getHTML();
        const html = this.content;
        this.hasH1H2 = html.includes('<h1') || html.includes('<h2');
        this.analyzeContent();
        this.cdr.detectChanges();
      },
      onSelectionUpdate: () => {
        this.cdr.detectChanges();
      },
      onTransaction: () => {
        this.cdr.detectChanges();
      },
      editorProps: {
        attributes: {
          class: 'prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed outline-none focus:outline-none min-h-[400px] w-full'
        },
        handlePaste: (view, event) => {
          if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length) {
            const file = event.clipboardData.files[0];
            if (file.type.startsWith('image/')) {
              event.preventDefault();
              this.handleImageUpload(file);
              return true;
            }
          }
          return false;
        },
        handleDrop: (view, event, slice, moved) => {
          if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
            const file = event.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
              event.preventDefault();
              this.handleImageUpload(file);
              return true;
            }
          }
          return false;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }

  onTitleChange(event: Event) {
    this.title = (event.target as HTMLTextAreaElement).value;
    this.analyzeContent();
  }
  
  onKeywordChange() {
    const kw = this.targetKeyword.toLowerCase();
    
    if (kw.includes('cliente') || kw.includes('clinica')) {
      this.lsiTerms = [
        { term: 'fidelización', present: false },
        { term: 'experiencia', present: false },
        { term: 'reseñas', present: false },
        { term: 'atención', present: false }
      ];
    } else if (kw.includes('seo') || kw.includes('marketing')) {
       this.lsiTerms = [
         { term: 'posicionamiento', present: false },
         { term: 'captación', present: false },
         { term: 'tráfico', present: false },
         { term: 'google', present: false }
       ];
    } else {
      this.lsiTerms = [
        { term: 'automatización', present: false },
        { term: 'recepción', present: false },
        { term: 'agendar citas', present: false },
        { term: 'ahorro costes', present: false },
      ];
    }
    
    this.analyzeContent();
  }

  analyzeContent() {
    const fullText = (this.title + ' ' + this.content).toLowerCase();
    
    // Word count
    const words = fullText.trim().split(/\s+/).filter(w => w.length > 0);
    this.wordCount = words.length;

    // Keyword density
    if (this.targetKeyword && this.wordCount > 0) {
      const keywordLower = this.targetKeyword.toLowerCase();
      const occurrences = fullText.split(keywordLower).length - 1;
      const kwWords = keywordLower.split(/\s+/).filter(w => w.length > 0).length;
      this.keywordDensity = (occurrences * kwWords / this.wordCount) * 100;
    } else {
      this.keywordDensity = 0;
    }

    // LSI terms check
    this.lsiTerms.forEach(lsi => {
       lsi.present = fullText.includes(lsi.term.toLowerCase());
    });

    // Generate Suggestions
    this.seoSuggestions = [];
    if (this.targetKeyword) {
      if (!this.title.toLowerCase().includes(this.targetKeyword.toLowerCase())) {
        this.seoSuggestions.push('Incluye tu Keyword (Target) en el Título Principal.');
      }
      if (this.keywordDensity < 0.5 && this.wordCount > 20) {
        this.seoSuggestions.push('Densidad baja: Repite más tu Keyword de forma estructurada en los párrafos.');
      } else if (this.keywordDensity > 3.0) {
        this.seoSuggestions.push('Aviso de Keyword Stuffing: Estás abusando de tu Target Keyword.');
      }
    } else {
      this.seoSuggestions.push('Define un Target Keyword arriba para que Copilot pueda guiarte.');
    }
    
    if (!this.hasH1H2 && this.wordCount > 10) {
      this.seoSuggestions.push('Estructura tu texto añadiendo al menos un título H2 usando la barra superior.');
    }
    
    const missingLsi = this.lsiTerms.filter(t => !t.present);
    if (missingLsi.length > 0 && missingLsi.length < this.lsiTerms.length && this.wordCount > 20) {
      this.seoSuggestions.push('Buen trabajo, pero intenta incorporar los otros términos semánticos (LSI) marcados en gris.');
    } else if (missingLsi.length === this.lsiTerms.length) {
      this.seoSuggestions.push('Considera añadir los términos LSI recomendados al texto para posicionar mejor.');
    }

    // Calculate score
    if (this.wordCount === 0) {
      this.healthScore = 0;
    } else {
      let score = 40; 
      if (this.wordCount > 300) score += 20;
      if (this.wordCount > 800) score += 10;
      if (this.wordCount > 1200) score += 10;
      
      if (this.keywordDensity >= 0.5 && this.keywordDensity <= 2.5) score += 10;
      if (this.hasH1H2) score += 10;
      
      const lsiPresent = this.lsiTerms.filter(t => t.present).length;
      score += Math.round((lsiPresent / this.lsiTerms.length) * 10);

      this.healthScore = Math.min(Math.round(score), 100);
    }
  }

  get healthScoreDisplay() {
    return this.healthScore > 0 ? this.healthScore.toString() : '--';
  }
  
  get circularProgressStyle() {
    return `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(#1B36D3 ${this.healthScore}%, #e2e8f0 0)`;
  }

  toggleFormat(format: string, level?: number) {
    if (!this.editor) return;

    if (format === 'bold') {
      this.editor.chain().focus().toggleBold().run();
    } else if (format === 'italic') {
      this.editor.chain().focus().toggleItalic().run();
    } else if (format === 'paragraph') {
      this.editor.chain().focus().setParagraph().run();
    } else if (format === 'heading' && level) {
      this.editor.chain().focus().toggleHeading({ level: level as any }).run();
    }
  }

  toggleAlign(alignment: string) {
    if (this.editor) {
      this.editor.chain().focus().setTextAlign(alignment as any).run();
    }
  }

  isAligned(alignment: string): boolean {
    return this.editor ? this.editor.isActive({ textAlign: alignment }) : false;
  }

  async setLink() {
    if (!this.editor) return;
    const previousUrl = this.editor.getAttributes('link')['href'] || '';
    const url = await this.openPrompt('Introduce la URL del enlace:', previousUrl);
    
    if (url === null) {
      return; // cancelled
    }
    
    if (url === '') {
      this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  isLinkActive(): boolean {
    return this.editor ? this.editor.isActive('link') : false;
  }

  injectLeadMagnet() {
    if (this.editor) {
      this.editor.chain().focus().insertContent({ type: 'leadMagnet' }).insertContent('<p></p>').run();
    }
  }

  injectDemoScheduler() {
    if (this.editor) {
      this.editor.chain().focus().insertContent({ type: 'demoScheduler' }).insertContent('<p></p>').run();
    }
  }

  async handleImageUpload(file: File) {
    try {
      const webpBase64 = await this.compressAndConvertToWebp(file);
      const altText = await this.openPrompt('Describe esta imagen para SEO (Etiqueta ALT):', '') || '';
      
      this.editor.chain().focus().setImage({ src: webpBase64, alt: altText }).run();
    } catch (error) {
      console.error('Error processing image:', error);
    }
  }

  async compressAndConvertToWebp(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > 1200) {
          height = Math.round((height * 1200) / width);
          width = 1200;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.8)); 
          URL.revokeObjectURL(objectUrl);
        } else {
          reject('No canvas context');
        }
      };
      img.onerror = () => reject('Image load failed');
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.handleImageUpload(file);
    }
  }

  async onCoverImageSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const webpBase64 = await this.compressAndConvertToWebp(file);
        this.coverImage = webpBase64;
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error compressing cover image', error);
      }
    }
  }

  removeCoverImage() {
    this.coverImage = '';
    this.cdr.detectChanges();
  }

  saveDraft() {
    this.submitPost(BlogPostStatus.DRAFT);
  }

  publishPost() {
    this.submitPost(BlogPostStatus.PUBLISHED);
  }

  // --- Modal Logic ---
  openPrompt(title: string, defaultValue = ''): Promise<string | null> {
    this.promptTitle = title;
    this.promptValue = defaultValue;
    this.showPromptModal = true;
    this.cdr.detectChanges();
    return new Promise((resolve) => {
      this.promptResolver = resolve;
    });
  }

  submitPrompt() {
    if (this.promptResolver) {
      this.promptResolver(this.promptValue);
      this.closePrompt();
    }
  }

  cancelPrompt() {
    if (this.promptResolver) {
      this.promptResolver(null);
      this.closePrompt();
    }
  }

  closePrompt() {
    this.showPromptModal = false;
    this.promptResolver = null;
    this.promptTitle = '';
    this.promptValue = '';
    this.cdr.detectChanges();
  }

  private submitPost(status: BlogPostStatus) {
    if (!this.title.trim() || !this.content.trim()) {
      alert('Por favor añade un título y un poco de contenido antes de guardar.');
      return;
    }

    if (!this.coverImage || !this.selectedAuthorId) {
      alert('⚠️ Para publicar o guardar, debes seleccionar un "Autor" (en la barra lateral) y subir una "Imagen de portada".');
      return;
    }

    if (this.wordCount < 300) {
      alert(`⚠️ El artículo es demasiado corto. Tienes ${this.wordCount} palabras, pero el mínimo recomendado para un buen SEO es de 300 palabras.`);
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    const payload: CreateBlogPostDto = {
      title: this.title,
      content: this.editor.getHTML(),
      coverImage: this.coverImage || undefined,
      coverImageAlt: this.coverImageAlt || this.title,
      status: status,
      authorName: this.selectedAuthorId,
      seoTitle: this.title,
      seoDescription: 'Generado desde el panel de Clínicas.'
    };

    this.blogService.createPost(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.cdr.detectChanges();
        alert(`¡Públicacion ${status === BlogPostStatus.PUBLISHED ? 'publicada' : 'guardada como borrador'} con éxito!`);
        this.router.navigate(['/admin/blog']);
      },
      error: (err) => {
        console.error('Error saving blog post', err);
        this.isSaving = false;
        this.cdr.detectChanges();
        alert('Hubo un error al conectar con el backend. Revisa la consola.');
      }
    });
  }
}
