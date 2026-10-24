import React, { forwardRef, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import './CardSwap.css';

export const Card = forwardRef(({ customClass, style, children, ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    style={style}
    className={`card-swap-card ${customClass ?? ''} ${rest.className ?? ''}`.trim()}
  >
    {children}
  </div>
));
Card.displayName = 'Card';

const makeSlot = (i, distX, distY, total) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
  opacity: Math.max(0.45, 1 - i * 0.09)
});

const placeNow = (el, slot, skew) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    opacity: slot.opacity,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

export default function CardSwap({
  width = 440,
  height = 360,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = true,
  skewAmount = 4,
  easing = 'elastic',
  children
}) {
  const config = useMemo(
    () =>
      easing === 'elastic'
        ? {
            ease: 'elastic.out(0.7,0.9)',
            durDrop: 1,
            durMove: 1,
            durReturn: 1,
            promoteOverlap: 0.85,
            returnDelay: 0.05
          }
        : {
            ease: 'power1.inOut',
            durDrop: 0.8,
            durMove: 0.8,
            durReturn: 0.8,
            promoteOverlap: 0.45,
            returnDelay: 0.2
          },
    [easing]
  );

  const childArr = useMemo(() => React.Children.toArray(children), [children]);
  const refs = useMemo(() => childArr.map(() => React.createRef()), [childArr.length]);

  const order = useRef(childArr.map((_, i) => i));
  const tlRef = useRef(null);
  const intervalRef = useRef(null);
  const container = useRef(null);

  useEffect(() => {
    const total = refs.length;
    if (!total) return;

    order.current = childArr.map((_, i) => i);

    refs.forEach((r, i) => {
      if (r.current) placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
    });

    const swap = () => {
      if (order.current.length < 2) return;

      const [front, ...rest] = order.current;
      const elFront = refs[front].current;
      if (!elFront) return;

      const tl = gsap.timeline();
      tlRef.current = tl;

      // Drop the front card behind the rest and fade it out immediately so
      // it never ghosts over the promoting cards or spills into page
      // content below the stack.
      tl.set(elFront, { zIndex: 0 });

      tl.to(elFront, {
        y: '+=140',
        opacity: 0,
        duration: config.durDrop,
        ease: config.ease
      });

      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el = refs[idx].current;
        if (!el) return;
        const slot = makeSlot(i, cardDistance, verticalDistance, total);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            opacity: slot.opacity,
            duration: config.durMove,
            ease: config.ease
          },
          `promote+=${i * 0.15}`
        );
      });

      const backSlot = makeSlot(total - 1, cardDistance, verticalDistance, total);
      tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
      tl.call(() => {
        gsap.set(elFront, { zIndex: backSlot.zIndex });
      }, undefined, 'return');
      tl.set(elFront, { x: backSlot.x, z: backSlot.z }, 'return');
      tl.to(
        elFront,
        {
          y: backSlot.y,
          opacity: backSlot.opacity,
          duration: config.durReturn,
          ease: config.ease
        },
        'return'
      );

      tl.call(() => {
        order.current = [...rest, front];
      });
    };

    swap();
    intervalRef.current = window.setInterval(swap, delay);

    const node = container.current;
    let pause, resume;
    if (pauseOnHover && node) {
      pause = () => {
        tlRef.current?.pause();
        clearInterval(intervalRef.current);
      };
      resume = () => {
        tlRef.current?.play();
        intervalRef.current = window.setInterval(swap, delay);
      };
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);
    }

    return () => {
      clearInterval(intervalRef.current);
      tlRef.current?.kill();
      if (pauseOnHover && node) {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refs.length, cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, config]);

  const rendered = childArr.map((child, i) =>
    React.isValidElement(child)
      ? React.cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) }
        })
      : child
  );

  return (
    <div ref={container} className="card-swap-container" style={{ width, height }}>
      {rendered}
    </div>
  );
}
