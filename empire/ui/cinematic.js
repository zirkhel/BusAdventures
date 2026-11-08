// Empire UI — event cinematics. The engine has already picked and saved the outcome;
// this only plays the matching media. Tap to skip.
//
//   { type: 'sequence', frames: [ { text, ms, color?, shake?, image? } ] }   no assets needed
//   { type: 'video', src }                                                   full-screen, no alpha needed
//   { type: 'image', src, ms }                                               still or animated WebP

export function playCinematic(el, cine, { asset, background, title } = {}) {
  return new Promise(resolve => {
    el.innerHTML = `<div class="emp-cine-bg" style="background-image:url('${background || ''}')"></div><div class="emp-cine-stage"></div><div class="emp-cine-title"></div><div class="emp-cine-skip">tap to skip</div>`;
    el.querySelector('.emp-cine-title').textContent = title || '';
    const stage = el.querySelector('.emp-cine-stage');
    let done = false, timer;
    const finish = () => { if (done) return; done = true; clearTimeout(timer); resolve(); };
    el.addEventListener('click', finish);

    if (!cine) { timer = setTimeout(finish, 800); return; }
    if (cine.type === 'video') {
      const v = document.createElement('video');
      Object.assign(v, { src: asset(cine.src), autoplay: true, playsInline: true, muted: cine.muted ?? false });
      v.className = 'emp-cine-media';
      v.onended = finish; v.onerror = finish;
      stage.appendChild(v);
      v.play?.().catch(() => { v.muted = true; v.play().catch(finish); });
      return;
    }
    if (cine.type === 'image') {
      stage.innerHTML = `<img class="emp-cine-media" src="${asset(cine.src)}" alt="">`;
      timer = setTimeout(finish, cine.ms || 2500);
      return;
    }
    const frames = cine.frames || [];
    let i = 0;
    const next = () => {
      if (done) return;
      if (i >= frames.length) return finish();
      const f = frames[i++];
      stage.innerHTML = '';
      if (f.image) {
        const img = document.createElement('img');
        img.src = asset(f.image); img.className = 'emp-cine-media';
        stage.appendChild(img);
      }
      if (f.text) {
        const t = document.createElement('div');
        t.className = 'emp-cine-text';
        t.textContent = f.text;
        if (f.color) t.style.color = f.color;
        stage.appendChild(t);
      }
      el.classList.remove('shake');
      void el.offsetWidth;
      if (f.shake) el.classList.add('shake');
      timer = setTimeout(next, f.ms || 900);
    };
    next();
  });
}
