/**
 * <image-slot> — custom element
 * Renders <img> when src is set; styled placeholder when empty.
 * Attrs: src, placeholder (alt text), radius (px), shape (circle)
 */
class ImageSlot extends HTMLElement {
  static get observedAttributes() { return ['src']; }

  connectedCallback()              { this._render(); }
  attributeChangedCallback()       { this._render(); }

  _render() {
    const src   = this.getAttribute('src');
    const alt   = this.getAttribute('placeholder') || '';
    const r     = this.getAttribute('radius');
    const shape = this.getAttribute('shape');

    const radius = shape === 'circle' ? '50%'
                 : r ? `${r}px` : '0';

    if (src) {
      this.innerHTML =
        `<img src="${src}" alt="${alt}" loading="lazy" decoding="async"
              style="width:100%;height:100%;object-fit:cover;display:block;
                     border-radius:${radius};pointer-events:none;">`;
      this.style.background = 'transparent';
      this.style.border     = 'none';
    }
  }
}

customElements.define('image-slot', ImageSlot);
