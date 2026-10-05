'use client';

import { useEffect } from 'react';

export default function ClientBoot({ page, bodyClass }) {
  useEffect(() => {
    document.body.className = bodyClass;
    document.body.dataset.page = page;
    if (document.body.dataset.dailycareBooted) return;
    document.body.dataset.dailycareBooted = 'true';

    const scripts = page === 'system' ? ['menu.js'] : ['day.js', 'app.js', 'menu.js'];
    const load = index => {
      if (index >= scripts.length) return;
      const script = document.createElement('script');
      script.src = `/${scripts[index]}`;
      script.onload = () => load(index + 1);
      script.onerror = () => console.error(`DailyCare could not load ${scripts[index]}`);
      document.body.appendChild(script);
    };
    load(0);
  }, [page, bodyClass]);

  return null;
}
