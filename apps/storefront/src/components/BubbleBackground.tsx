"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  type SpringOptions,
} from "framer-motion";

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

type BubbleColors = {
  first: string;
  second: string;
  third: string;
  fourth: string;
  fifth: string;
  sixth: string;
};

type BubbleBackgroundProps = React.ComponentProps<"div"> & {
  interactive?: boolean;
  transition?: SpringOptions;
  colors?: BubbleColors;
};

function BubbleBackground({
  ref,
  className,
  children,
  interactive = false,
  transition = { stiffness: 100, damping: 20 },
  colors = {
    first: "57,15,16",    // deep maroon #390f10 - wood
    second: "176,141,87", // gold #b08d57 - premium
    third: "212,165,116", // goldlight #d4a574 - warm glow
    fourth: "253,232,208", // blush #fde8d0
    fifth: "212,184,150", // taupe #d4b896
    sixth: "139,58,26",   // mocha #8b3a1a - interactive wood
  },
  ...props
}: BubbleBackgroundProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, transition);
  const springY = useSpring(mouseY, transition);

  const rectRef = React.useRef<DOMRect | null>(null);
  const rafIdRef = React.useRef<number | null>(null);

  React.useLayoutEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        rectRef.current = containerRef.current.getBoundingClientRect();
      }
    };

    updateRect();

    const el = containerRef.current;
    const ro = new ResizeObserver(updateRect);
    if (el) ro.observe(el);

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, []);

  React.useEffect(() => {
    if (!interactive) return;

    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = rectRef.current;
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
      });
    };

    el.addEventListener("mousemove", handleMouseMove as EventListener, {
      passive: true,
    });
    return () => {
      el.removeEventListener("mousemove", handleMouseMove as EventListener);
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    };
  }, [interactive, mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      data-slot="bubble-background"
      className={cn(
        "relative size-full overflow-hidden bg-gradient-to-br from-ivory via-cream to-sand",
        className,
      )}
      {...props}
    >
      <style>
        {`
            :root {
              --first-color: ${colors.first};
              --second-color: ${colors.second};
              --third-color: ${colors.third};
              --fourth-color: ${colors.fourth};
              --fifth-color: ${colors.fifth};
              --sixth-color: ${colors.sixth};
            }
          `}
      </style>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-0 left-0 w-0 h-0"
      >
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="16"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div
        className="absolute inset-0 opacity-60"
        style={{ filter: "url(#goo) blur(32px)" }}
      >
        <motion.div
          className="absolute rounded-full size-[70%] top-[8%] left-[12%] mix-blend-multiply bg-[radial-gradient(circle_at_center,rgba(var(--first-color),0.45)_0%,rgba(var(--first-color),0)_60%)]"
          animate={{ y: [-30, 30, -30] }}
          transition={{ duration: 28, ease: "easeInOut", repeat: Infinity }}
          style={{ transform: "translateZ(0)", willChange: "transform" }}
        />

        <motion.div
          className="absolute inset-0 flex justify-center items-center origin-[calc(50%-300px)]"
          animate={{ rotate: 360 }}
          transition={{
            duration: 24,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
          }}
          style={{ transform: "translateZ(0)", willChange: "transform" }}
        >
          <div className="rounded-full size-[70%] top-[10%] left-[10%] mix-blend-multiply bg-[radial-gradient(circle_at_center,rgba(var(--second-color),0.40)_0%,rgba(var(--second-color),0)_60%)]" />
        </motion.div>

        <motion.div
          className="absolute inset-0 flex justify-center items-center origin-[calc(50%+300px)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 36, ease: "linear", repeat: Infinity }}
          style={{ transform: "translateZ(0)", willChange: "transform" }}
        >
          <div className="absolute rounded-full size-[70%] bg-[radial-gradient(circle_at_center,rgba(var(--third-color),0.50)_0%,rgba(var(--third-color),0)_60%)] mix-blend-multiply top-[calc(50%+160px)] left-[calc(50%-380px)]" />
        </motion.div>

        <motion.div
          className="absolute rounded-full size-[70%] top-[10%] left-[10%] mix-blend-multiply bg-[radial-gradient(circle_at_center,rgba(var(--fourth-color),0.38)_0%,rgba(var(--fourth-color),0)_60%)] opacity-70"
          animate={{ x: [-30, 30, -30] }}
          transition={{ duration: 32, ease: "easeInOut", repeat: Infinity }}
          style={{ transform: "translateZ(0)", willChange: "transform" }}
        />

        <motion.div
          className="absolute inset-0 flex justify-center items-center origin-[calc(50%_-_600px)_calc(50%_+_160px)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 28, ease: "linear", repeat: Infinity }}
          style={{ transform: "translateZ(0)", willChange: "transform" }}
        >
          <div className="absolute rounded-full size-[130%] mix-blend-multiply bg-[radial-gradient(circle_at_center,rgba(var(--fifth-color),0.35)_0%,rgba(var(--fifth-color),0)_60%)] top-[calc(50%-65%)] left-[calc(50%-65%)]" />
        </motion.div>

        {interactive && (
          <motion.div
            className="absolute rounded-full size-full mix-blend-multiply bg-[radial-gradient(circle_at_center,rgba(var(--sixth-color),0.28)_0%,rgba(var(--sixth-color),0)_60%)] opacity-60"
            style={{
              x: springX,
              y: springY,
              transform: "translateZ(0)",
              willChange: "transform",
            }}
          />
        )}
      </div>

      <div className="relative z-10 size-full">
        {children}
      </div>
    </div>
  );
}

export { BubbleBackground, type BubbleBackgroundProps };

export default BubbleBackground;
