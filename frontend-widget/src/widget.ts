/**
 * AI Agents Lab Widget
 * 
 * Embeddable JavaScript widget for AI agents
 * Usage:
 *   <div id="ai-booking-agent" data-api-key="xxx" data-agent="booking"></div>
 *   <script src="https://cdn.agentslab.ai/widget.js"></script>
 */

interface WidgetConfig {
  apiKey?: string;
  agent: string;
  businessId?: string;
  apiUrl?: string;
  theme?: 'light' | 'dark';
  primaryColor?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class AIAgentsWidget {
  private config: WidgetConfig;
  private container: HTMLElement;
  private messages: Message[] = [];
  private sessionId: string;
  private isOpen: boolean = false;
  private apiUrl: string;

  constructor(containerId: string, config: WidgetConfig) {
    this.config = {
      apiUrl: config.apiUrl || 'https://api.agentslab.ai/api/v1',
      theme: config.theme || 'light',
      ...config,
    };
    
    const containerElement = document.getElementById(containerId);
    if (!containerElement) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = containerElement;
    
    this.sessionId = this.generateSessionId();
    this.apiUrl = this.config.apiUrl!;
    
    this.init();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private init(): void {
    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="ai-agents-widget" data-theme="${this.config.theme}">
        <div class="widget-toggle" onclick="window.aiAgentsWidget_${this.container.id}.toggle()">
          <span class="widget-icon">💬</span>
        </div>
        <div class="widget-container" style="display: ${this.isOpen ? 'flex' : 'none'}">
          <div class="widget-header">
            <h3>AI Assistant</h3>
            <button class="widget-close" onclick="window.aiAgentsWidget_${this.container.id}.toggle()">×</button>
          </div>
          <div class="widget-messages" id="${this.container.id}-messages">
            <div class="message assistant">
              <p>¡Hola! ¿En qué puedo ayudarte hoy?</p>
            </div>
          </div>
          <div class="widget-input-container">
            <input 
              type="text" 
              class="widget-input" 
              id="${this.container.id}-input"
              placeholder="Escribe tu mensaje..."
              onkeypress="if(event.key==='Enter') window.aiAgentsWidget_${this.container.id}.sendMessage()"
            />
            <button class="widget-send" onclick="window.aiAgentsWidget_${this.container.id}.sendMessage()">
              Enviar
            </button>
          </div>
        </div>
      </div>
    `;
    
    this.injectStyles();
  }

  private injectStyles(): void {
    if (document.getElementById('ai-agents-widget-styles')) {
      return; // Styles already injected
    }

    const style = document.createElement('style');
    style.id = 'ai-agents-widget-styles';
    style.textContent = `
      .ai-agents-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .widget-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${this.config.primaryColor || '#3B82F6'};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: transform 0.2s;
      }
      .widget-toggle:hover {
        transform: scale(1.1);
      }
      .widget-container {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        height: 600px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .widget-header {
        padding: 16px;
        background: ${this.config.primaryColor || '#3B82F6'};
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .widget-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      .widget-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
      }
      .widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f5f5f5;
      }
      .message {
        margin-bottom: 12px;
        padding: 12px;
        border-radius: 12px;
        max-width: 80%;
      }
      .message.user {
        background: ${this.config.primaryColor || '#3B82F6'};
        color: white;
        margin-left: auto;
        text-align: right;
      }
      .message.assistant {
        background: white;
        color: #333;
        margin-right: auto;
      }
      .widget-input-container {
        display: flex;
        padding: 16px;
        background: white;
        border-top: 1px solid #e5e5e5;
        gap: 8px;
      }
      .widget-input {
        flex: 1;
        padding: 12px;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        font-size: 14px;
      }
      .widget-send {
        padding: 12px 24px;
        background: ${this.config.primaryColor || '#3B82F6'};
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      .widget-send:hover {
        opacity: 0.9;
      }
      @media (max-width: 480px) {
        .widget-container {
          width: 100vw;
          height: 100vh;
          bottom: 0;
          right: 0;
          border-radius: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private attachEventListeners(): void {
    // Store reference globally for inline handlers
    (window as any)[`aiAgentsWidget_${this.container.id}`] = this;
  }

  public toggle(): void {
    this.isOpen = !this.isOpen;
    const container = this.container.querySelector('.widget-container') as HTMLElement;
    if (container) {
      container.style.display = this.isOpen ? 'flex' : 'none';
    }
  }

  public async sendMessage(): Promise<void> {
    const input = document.getElementById(`${this.container.id}-input`) as HTMLInputElement;
    const message = input?.value.trim();
    
    if (!message) return;
    
    // Clear input
    if (input) input.value = '';
    
    // Add user message to UI
    this.addMessage('user', message);
    
    // Show loading
    const loadingId = this.addMessage('assistant', '...');
    
    try {
      // Determine endpoint
      const endpoint = this.config.apiKey 
        ? `${this.apiUrl}/agents/${this.config.agent}/chat`
        : `${this.apiUrl}/demo/${this.config.agent}/chat`;
      
      // Make request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-Key': this.config.apiKey,
          }),
        },
        body: JSON.stringify({
          message,
          sessionId: this.sessionId,
          businessId: this.config.businessId || 'default',
        }),
      });
      
      const data = await response.json();
      
      // Remove loading message
      this.removeMessage(loadingId);
      
      // Add assistant response
      if (data.limitReached) {
        this.addMessage('assistant', data.response);
        this.addMessage('assistant', '💡 Regístrate para obtener acceso ilimitado: ' + (data.upgradeUrl || 'https://agentslab.ai/signup'));
      } else {
        this.addMessage('assistant', data.response || data.message || 'Lo siento, no pude procesar tu solicitud.');
      }
    } catch (error) {
      this.removeMessage(loadingId);
      this.addMessage('assistant', 'Lo siento, hubo un error. Por favor, intenta de nuevo.');
      console.error('Widget error:', error);
    }
  }

  private addMessage(role: 'user' | 'assistant', content: string): string {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messagesContainer = document.getElementById(`${this.container.id}-messages`);
    
    if (!messagesContainer) return messageId;
    
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `<p>${this.escapeHtml(content)}</p>`;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageId;
  }

  private removeMessage(messageId: string): void {
    const message = document.getElementById(messageId);
    if (message) {
      message.remove();
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Auto-initialize widgets on page load
(function() {
  function initWidgets() {
    const widgets = document.querySelectorAll('[id^="ai-"], [data-ai-agent]');
    
    widgets.forEach((element) => {
      const container = element as HTMLElement;
      const agent = container.getAttribute('data-agent') || 
                   container.id.replace('ai-', '').replace('-agent', '');
      const apiKey = container.getAttribute('data-api-key') || '';
      const businessId = container.getAttribute('data-business-id') || '';
      const apiUrl = container.getAttribute('data-api-url') || '';
      const theme = (container.getAttribute('data-theme') || 'light') as 'light' | 'dark';
      const primaryColor = container.getAttribute('data-primary-color') || '';
      
      if (agent) {
        try {
          new AIAgentsWidget(container.id, {
            agent,
            apiKey,
            businessId,
            apiUrl,
            theme,
            primaryColor,
          });
        } catch (error) {
          console.error(`Error initializing widget ${container.id}:`, error);
        }
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
  } else {
    initWidgets();
  }
})();

// Export for manual initialization
if (typeof window !== 'undefined') {
  (window as any).AIAgentsWidget = AIAgentsWidget;
}


