'use client';

import React, { useState, useEffect, useRef, HTMLAttributes } from 'react';
import { useRouter } from 'next/navigation';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
}

export interface GalleryItem {
  common: string;
  binomial: string;
  productSlug?: string;
  photo: {
    url: string;
    text: string;
    pos?: string;
    by: string;
  };
}

interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  radius?: number;
  autoRotateSpeed?: number;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 600, autoRotateSpeed = 0.12, ...props }, ref) => {
    const router = useRouter();
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [responsive, setResponsive] = useState({ radius, cardW: 300, cardH: 288 });
    const startXRef = useRef(0);
    const startRotationRef = useRef(0);
    const velocityRef = useRef(0);
    const lastXRef = useRef(0);
    const lastTimeRef = useRef(0);
    const dragDistanceRef = useRef(0);
    const suppressClickRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Responsive: mobile kept perfect, desktop heights -20% more (10% already + 20% extra)
    useEffect(() => {
      const update = () => {
        const w = window.innerWidth;
        if (w < 480) {
          setResponsive({ radius: 320, cardW: 220, cardH: 270 });
        } else if (w < 640) {
          setResponsive({ radius: 340, cardW: 240, cardH: 288 });
        } else if (w < 768) {
          setResponsive({ radius: 420, cardW: 260, cardH: 324 });
        } else if (w < 1024) {
          setResponsive({ radius: 520, cardW: 280, cardH: 342 });
        } else if (w < 1440) {
          setResponsive({ radius: 600, cardW: 300, cardH: 288 }); // 360 * 0.8 = 288 (desktop only)
        } else {
          setResponsive({ radius: 680, cardW: 320, cardH: 302 }); // 378 * 0.8 = 302
        }
      };
      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }, []);

    // Momentum + auto-rotate (slow left → right) — paused on hover/drag so click lands
    useEffect(() => {
      if (isDragging || isHovered) return;

      const animate = () => {
        if (Math.abs(velocityRef.current) > 0.01) {
          setRotation((prev) => prev + velocityRef.current);
          velocityRef.current *= 0.96; // friction
          animationFrameRef.current = requestAnimationFrame(animate);
        } else if (autoRotateSpeed !== 0) {
          velocityRef.current = autoRotateSpeed;
          setRotation((prev) => prev + velocityRef.current);
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animationFrameRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }, [isDragging, isHovered, autoRotateSpeed]);

    const handlePointerDown = (e: React.PointerEvent) => {
      setIsDragging(true);
      startXRef.current = e.clientX;
      startRotationRef.current = rotation;
      lastXRef.current = e.clientX;
      lastTimeRef.current = Date.now();
      velocityRef.current = 0;
      dragDistanceRef.current = 0;
      suppressClickRef.current = false;
      // NOTE: no setPointerCapture here — capturing on the container
      // retargets the follow-up click to the container, so card
      // onClick never fires and "View Product" appears dead.
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startXRef.current;
      const sensitivity = 0.32;
      const newRotation = startRotationRef.current + deltaX * sensitivity;
      setRotation(newRotation);

      const now = Date.now();
      if (now - lastTimeRef.current > 0) {
        const dx = e.clientX - lastXRef.current;
        dragDistanceRef.current += Math.abs(dx);
        velocityRef.current = dx * sensitivity * 0.55;
        lastXRef.current = e.clientX;
        lastTimeRef.current = now;
      }
    };

    const handleCardClick = (slug?: string) => (e: React.MouseEvent) => {
      if (suppressClickRef.current || dragDistanceRef.current > 8) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (slug) router.push(`/product/${slug}`);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      if (!isDragging) return;
      if (dragDistanceRef.current > 8) {
        suppressClickRef.current = true;
        window.setTimeout(() => { suppressClickRef.current = false; }, 200);
      }
      setIsDragging(false);
      if (Math.abs(velocityRef.current) < 0.5) {
        velocityRef.current *= 0.4;
      }
    };

    const anglePerItem = 360 / items.length;
    const { radius: activeRadius, cardW, cardH } = responsive;

    const setRefs = (el: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    };

    return (
      <div
        ref={setRefs}
        role="region"
        aria-label="Circular 3D Gallery - drag to rotate"
        className={cn(
          "relative w-full h-full flex items-center justify-center select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          className
        )}
        style={{
          perspective: '1600px',
          perspectiveOrigin: '50% 50%',
          touchAction: 'pan-y',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d',
            transition: isDragging ? 'none' : 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = ((rotation % 360) + 360) % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.25, 1 - normalizedAngle / 150);
            const isCenter = normalizedAngle < 25;

            const CardTag = item.productSlug ? 'a' : 'div';
            return (
              <CardTag
                key={item.photo.url + i}
                {...(item.productSlug ? { href: `/product/${item.productSlug}` } : {})}
                role={item.productSlug ? "link" : "group"}
                aria-label={item.common}
                tabIndex={item.productSlug ? 0 : undefined}
                onClick={handleCardClick(item.productSlug)}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && item.productSlug) router.push(`/product/${item.productSlug}`); }}
                className="absolute"
                draggable={false}
                style={{
                  width: `${cardW}px`,
                  height: `${cardH}px`,
                  left: '50%',
                  top: '50%',
                  marginLeft: `${-cardW / 2}px`,
                  marginTop: `${-cardH / 2}px`,
                  transform: `rotateY(${itemAngle}deg) translateZ(${activeRadius}px)`,
                  opacity: opacity,
                  transition: isDragging ? 'opacity 0.15s linear' : 'opacity 0.5s linear, transform 0.5s linear',
                  filter: isCenter ? 'brightness(1.05)' : 'brightness(0.92)',
                  cursor: item.productSlug ? 'pointer' : undefined,
                }}
              >
                <div className="relative w-full h-full rounded-xl shadow-2xl overflow-hidden group border border-white/20 bg-white/10 backdrop-blur-md">
                  <img
                    src={item.photo.url}
                    alt={item.photo.text}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                    style={{ objectPosition: item.photo.pos || 'center' }}
                    draggable={false}
                  />
                  <div className="absolute bottom-0 left-0 w-full p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                    <h2 className="text-base sm:text-xl font-bold leading-tight">{item.common}</h2>
                    <em className="text-xs sm:text-sm italic opacity-80 line-clamp-1">{item.binomial}</em>
                    <p className="text-[10px] sm:text-xs mt-1 sm:mt-2 opacity-60">Photo by: {item.photo.by}</p>
                    {item.productSlug && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur transition group-hover:bg-gold group-hover:text-white">
                        View Product →
                      </span>
                    )}
                  </div>
                </div>
              </CardTag>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };
