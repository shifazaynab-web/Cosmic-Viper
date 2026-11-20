// qr-generator.js
window.QRTypes = [
  'url','text','wifi','email','phone','sms','vcard','location','event','social','payment'
];

window.buildPayload = function(type, data) {
  switch(type) {
    case 'url': return data.url || '';
    case 'text': return data.text || '';
    case 'wifi': {
      const enc = data.encryption || 'WPA';
      const hidden = data.hidden ? 'true' : 'false';
      return `WIFI:T:${enc};S:${escapeWifi(data.ssid)};P:${escapeWifi(data.password)};H:${hidden};;`;
    }
    case 'email': {
      let s = `mailto:${data.email}`;
      const params = [];
      if (data.subject) params.push('subject=' + encodeURIComponent(data.subject));
      if (data.body) params.push('body=' + encodeURIComponent(data.body));
      if (params.length) s += '?' + params.join('&');
      return s;
    }
    case 'phone': return `tel:${data.phone}`;
    case 'sms': return `smsto:${data.phone}:${data.message || ''}`;
    case 'vcard': {
      const lines = ['BEGIN:VCARD','VERSION:3.0'];
      if (data.name) lines.push(`FN:${data.name}`);
      if (data.org) lines.push(`ORG:${data.org}`);
      if (data.phone) lines.push(`TEL:${data.phone}`);
      if (data.email) lines.push(`EMAIL:${data.email}`);
      if (data.url) lines.push(`URL:${data.url}`);
      if (data.address) lines.push(`ADR:;;${data.address};;;;`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }
    case 'location': return `geo:${data.lat},${data.lng}`;
    case 'event': {
      const fmt = (d) => d ? d.replace(/[-:]/g,'').slice(0,15) + 'Z' : '';
      return `BEGIN:VEVENT\nSUMMARY:${data.title}\nLOCATION:${data.location}\nDESCRIPTION:${data.description}\nDTSTART:${fmt(data.start)}\nDTEND:${fmt(data.end)}\nEND:VEVENT`;
    }
    case 'social': return data.url || '';
    case 'payment': return data.uri || '';
    default: return '';
  }
};
function escapeWifi(s){ return (s||'').replace(/([\\;,:"])/g,'\\$1'); }
window.describeType = function(type){ return (window.TYPE_LABELS||{})[type] || type; };
window.TYPE_LABELS = { url:'Website URL', text:'Plain Text', wifi:'Wi-Fi', email:'Email', phone:'Phone', sms:'SMS', vcard:'Contact (vCard)', location:'Location', event:'Event', social:'Social Media', payment:'Payment' };
