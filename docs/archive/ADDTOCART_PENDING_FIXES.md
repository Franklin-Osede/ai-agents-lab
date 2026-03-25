# 🔧 AddToCart Agent - Fixes Pendientes

## ✅ **COMPLETADO:**

1. Audio se detiene correctamente al salir del welcome screen

---

## 🚧 **PENDIENTE - Plan de Acción:**

### **2. Cart List - Botones "View Order" y "Recuperar"**

**Problema:** Los botones no hacen nada

**Archivos a modificar:**

- `cart-list.component.ts`
- `cart-list.component.html`

**Solución:**

```typescript
// En cart-list.component.ts

viewOrder(cartId: string): void {
  // Navegar al detalle del carrito
  this.router.navigate(['/abandoned-cart', cartId]);
}

recoverCart(cartId: string): void {
  // Llamar al servicio para recuperar el carrito
  this.cartService.recoverCart(cartId).subscribe({
    next: () => {
      this.showToast('Carrito recuperado exitosamente');
      this.loadCarts(); // Recargar lista
    },
    error: (err) => {
      console.error('Error recovering cart:', err);
      this.showToast('Error al recuperar el carrito');
    }
  });
}
```

---

### **3. Dashboard Metrics - Navegación Diferenciada**

**Problema:** Todas las métricas llevan a la misma pantalla

**Archivo:** `dashboard.component.ts`

**Solución Actual (líneas 89-121):**

```typescript
onMetricClick(metric: string): void {
  switch (metric) {
    case 'abandoned-today':
      // Filtrar por hoy
      this.router.navigate(['/abandoned-cart/list'], {
        queryParams: { filter: 'today' }
      });
      break;

    case 'total-value':
      // Ordenar por valor descendente
      this.router.navigate(['/abandoned-cart/list'], {
        queryParams: { sort: 'value', order: 'desc' }
      });
      break;

    case 'recovery-rate':
      // Ir a performance analytics
      this.router.navigate(['/abandoned-cart/performance']);
      break;

    case 'recovered-revenue':
      // Filtrar por recuperados
      this.router.navigate(['/abandoned-cart/list'], {
        queryParams: { status: 'RECOVERED' }
      });
      break;
  }
}
```

**Problema:** El `cart-list.component` no está leyendo los queryParams

**Solución:** Modificar `cart-list.component.ts` para leer y aplicar los filtros:

```typescript
ngOnInit(): void {
  // Leer query params de la ruta
  this.route.queryParams.subscribe(params => {
    // Aplicar filtro por fecha
    if (params['filter'] === 'today') {
      this.filterByToday();
    }

    // Aplicar ordenamiento
    if (params['sort'] === 'value') {
      this.sortByValue(params['order'] || 'desc');
    }

    // Aplicar filtro por estado
    if (params['status']) {
      this.setStatusFilter(params['status']);
    }
  });

  this.loadCarts();
}

private filterByToday(): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  this.filteredCarts.update(carts =>
    carts.filter(cart => {
      const cartDate = new Date(cart.abandonedAt);
      cartDate.setHours(0, 0, 0, 0);
      return cartDate.getTime() === today.getTime();
    })
  );
}

private sortByValue(order: 'asc' | 'desc'): void {
  this.filteredCarts.update(carts =>
    [...carts].sort((a, b) => {
      const diff = a.totalValue - b.totalValue;
      return order === 'desc' ? -diff : diff;
    })
  );
}
```

---

### **4. Campañas - Flujo Completo + Lead Capture**

**Archivos:**

- `campaign-editor.component.ts`
- `campaign-editor.component.html`

**Flujo Deseado:**

```
1. Usuario crea campaña
   ↓
2. Configura todos los pasos
   ↓
3. Guarda campaña exitosamente
   ↓
4. Mostrar modal de lead capture
   ↓
5. Capturar email del usuario
```

**Implementación:**

```typescript
// En campaign-editor.component.ts

saveCampaign(): void {
  this.loading.set(true);

  this.campaignService.createCampaign(this.campaignData).subscribe({
    next: (campaign) => {
      this.loading.set(false);
      this.showSuccessMessage('Campaña creada exitosamente');

      // Mostrar lead capture después de 1 segundo
      setTimeout(() => {
        this.showLeadCaptureModal();
      }, 1000);
    },
    error: (err) => {
      this.loading.set(false);
      this.showErrorMessage('Error al crear la campaña');
    }
  });
}

showLeadCaptureModal(): void {
  // Emitir evento o usar un servicio global
  this.leadCaptureService.show({
    title: '¿Te ha gustado la demo? 🎉',
    message: 'Déjanos tu email para enviarte una guía exclusiva sobre recuperación de carritos.',
    onSuccess: (email) => {
      console.log('Email captured:', email);
      this.router.navigate(['/abandoned-cart/campaigns']);
    }
  });
}
```

---

## 📝 **Resumen de Cambios Necesarios:**

| Componente      | Archivo                        | Cambio                     | Prioridad |
| --------------- | ------------------------------ | -------------------------- | --------- |
| Welcome Chat    | `welcome-chat.component.ts`    | ✅ Audio cleanup           | HECHO     |
| Cart List       | `cart-list.component.ts`       | Implementar viewOrder()    | ALTA      |
| Cart List       | `cart-list.component.ts`       | Implementar recoverCart()  | ALTA      |
| Cart List       | `cart-list.component.ts`       | Leer queryParams y filtrar | ALTA      |
| Dashboard       | `dashboard.component.ts`       | ✅ Ya tiene navegación     | OK        |
| Campaign Editor | `campaign-editor.component.ts` | Lead capture al final      | MEDIA     |

---

## 🎯 **Próximos Pasos:**

1. ✅ Audio cleanup - COMPLETADO
2. ⏳ Arreglar botones de Cart List
3. ⏳ Implementar filtros en Cart List basados en queryParams
4. ⏳ Agregar lead capture al final del flujo de campañas

¿Quieres que proceda con los cambios 2, 3 y 4?
