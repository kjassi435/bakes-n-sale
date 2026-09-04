'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import RatingStars from './RatingStars';

export default function ReviewsBox({ product }: { product: any }) {
  const { user, showToast } = useStore();
  const [reviews, setReviews] = useState<any[]>(product.reviews ?? []);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api(`/catalog/products/${product.id}/reviews`, {
        method: 'POST',
        body: { rating, title, body },
      });
      showToast('Thank you for your review!');
      setTitle('');
      setBody('');
      const fresh = await api(`/products/${product.slug}`);
      setReviews(fresh.product.reviews ?? []);
    } catch (err: any) {
      showToast(err.message ?? 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* List */}
      <div>
        <h3 className="mb-5 font-display text-xl font-semibold">
          What patrons say {product.ratingCount > 0 && <span className="text-sm font-normal text-mocha">· {product.ratingAvg}★ ({product.ratingCount} reviews)</span>}
        </h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-mocha">No reviews yet — be the first to share your experience.</p>
        ) : (
          <div className="space-y-5">
            {reviews.map((r) => (
              <div key={r.id} className="card-lux p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{r.userName}</p>
                  <RatingStars rating={r.rating} />
                </div>
                {r.title && <p className="mt-1.5 text-sm font-semibold text-cocoa">{r.title}</p>}
                {r.body && <p className="mt-1 text-sm leading-relaxed text-mocha">{r.body}</p>}
                <p className="mt-2 text-[11px] text-mocha/70">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="card-lux h-fit p-6">
        <h3 className="font-display text-xl font-semibold">Write a review</h3>
        {!user ? (
          <p className="mt-3 text-sm text-mocha">
            Please <a href={`/login?next=/product/${product.slug}`} className="font-semibold text-gold underline">sign in</a> to share your experience.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-mocha uppercase">Your rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onClick={() => setRating(i)} className={`text-2xl ${i <= rating ? 'text-gold' : 'text-taupe'}`}>★</button>
                ))}
              </div>
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up in a line" className="input-lux" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tell us about the taste, packaging, delivery…" rows={4} className="input-lux resize-none" />
            <button disabled={submitting} className="btn-gold w-full">{submitting ? 'Submitting…' : 'Submit Review'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
