// qr-customizer.js
window.QRCustomizer = {
  defaults: { width:300, height:300, margin:10, dotsOptions:{type:'square',color:'#000000'}, backgroundOptions:{color:'#ffffff'}, cornersSquareOptions:{type:'square',color:'#000000'}, cornersDotOptions:{type:'square',color:'#000000'}, errorCorrectionLevel:'Q' },
  state: null,
  init(state){ this.state = Object.assign({}, this.defaults, state||{}); },
  buildOptions(data, payload) {
    const s = this.state || this.defaults;
    return {
      width: s.width, height: s.height, margin: s.margin, data: payload,
      dotsOptions: s.dotsOptions,
      backgroundOptions: s.backgroundOptions,
      cornersSquareOptions: s.cornersSquareOptions,
      cornersDotOptions: s.cornersDotOptions,
      image: s.image || undefined,
      imageOptions: { crossOrigin:'anonymous', margin: s.imageMargin||8, imageSize: s.imageSize||0.3 },
      qrOptions: { errorCorrectionLevel: s.errorCorrectionLevel || 'Q' }
    };
  },
  render(container, opts) {
    if (!window.QRCodeStyling) { container.innerHTML = '<p>QR library failed to load.</p>'; return null; }
    const qr = new QRCodeStyling(opts);
    container.innerHTML = '';
    qr.append(container);
    return qr;
  }
};
window.QRCodeStylingGlobal = window.QRCodeStyling;
