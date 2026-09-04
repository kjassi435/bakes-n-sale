'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="mt-6 rounded-lg bg-gold/10 p-3 text-sm font-semibold text-gold">
        ✦ Welcome to the Inner Crust — your first letter is on its way.
      </p>
    );
  }

  return (
    <form
      className="mt-6 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) setDone(true);
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="input-lux"
      />
      <button className="btn-gold shrink-0">Join</button>
    </form>
  );
}
