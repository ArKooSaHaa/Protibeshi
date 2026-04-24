import { useLayoutEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './ScrollHero.module.css';

gsap.registerPlugin(ScrollTrigger);

type StorySection = {
  imageSrc: string;
  alt: string;
  heading: string;
  motion: 'scaleLarge' | 'rise' | 'scaleSoft';
};

const STORY_SECTIONS: StorySection[] = [
  {
    imageSrc: '/pic2.png',
    alt: 'Illuminated neighborhood windows in evening light',
    heading: 'Every window has a story',
    motion: 'scaleLarge',
  },
  {
    imageSrc: '/pic3.png',
    alt: 'Neighbors connecting through shared conversation',
    heading: 'Connect instantly',
    motion: 'rise',
  },
  {
    imageSrc: '/pic4.png',
    alt: 'Residents gathering to strengthen their community',
    heading: 'Build your community',
    motion: 'scaleSoft',
  },
];

export const ScrollHero = () => {
  const rootRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const lenis = new Lenis({
      smoothWheel: true,
      duration: 1.1,
      touchMultiplier: 1.05,
    });

    const onLenisScroll = () => {
      ScrollTrigger.update();
    };

    lenis.on('scroll', onLenisScroll);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(ticker);

    const ctx = gsap.context(() => {
      const hero = root.querySelector<HTMLElement>('[data-scroll-hero]');
      const heroVideo = root.querySelector<HTMLElement>('[data-scroll-hero-video]');
      const heroText = root.querySelector<HTMLElement>('[data-scroll-hero-text]');

      if (hero && heroVideo && heroText) {
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: () => `+=${Math.round(window.innerHeight * 0.95)}`,
              scrub: true,
              pin: true,
              pinSpacing: false,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
          .to(heroVideo, { scale: 1.2 }, 0)
          .to(heroText, { autoAlpha: 0, yPercent: -28 }, 0);
      }

      const storySections = gsap.utils.toArray<HTMLElement>('[data-scroll-story]');

      storySections.forEach((section) => {
        const image = section.querySelector<HTMLElement>('[data-scroll-image]');
        const copy = section.querySelector<HTMLElement>('[data-scroll-copy]');
        const motion = section.dataset.motion;

        if (!image || !copy) {
          return;
        }

        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            end: 'bottom 38%',
            scrub: true,
          },
        });

        if (motion === 'rise') {
          timeline.fromTo(
            image,
            { y: 40, autoAlpha: 0.52 },
            { y: 0, autoAlpha: 1, immediateRender: false },
            0,
          );
        } else if (motion === 'scaleSoft') {
          timeline.fromTo(
            image,
            { scale: 1, autoAlpha: 0.52 },
            { scale: 1.05, autoAlpha: 1, immediateRender: false },
            0,
          );
        } else {
          timeline.fromTo(
            image,
            { scale: 1, autoAlpha: 0.52 },
            { scale: 1.1, autoAlpha: 1, immediateRender: false },
            0,
          );
        }

        timeline.fromTo(
          copy,
          { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, immediateRender: false },
          0.06,
        );
      });
    }, root);

    return () => {
      ctx.revert();
      lenis.off('scroll', onLenisScroll);
      gsap.ticker.remove(ticker);
      lenis.destroy();
    };
  }, []);

  return (
    <section ref={rootRef} className={styles.scrollHero}>
      <section className={styles.hero} data-scroll-hero>
        <video
          className={styles.heroVideo}
          data-scroll-hero-video
          src="/hero.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />

        <div className={styles.heroOverlay} aria-hidden="true" />

        <div className={styles.heroCenter} data-scroll-hero-text>
          <p className={styles.heroKicker}>Cinematic Neighborhood Story</p>
          <h1 className={styles.heroTitle}>Where every lane feels alive</h1>
        </div>
      </section>

      <div className={styles.storyStack}>
        {STORY_SECTIONS.map((section) => (
          <section
            key={section.heading}
            className={styles.storySection}
            data-scroll-story
            data-motion={section.motion}
          >
            <div className={styles.storyMedia}>
              <img
                className={styles.storyImage}
                data-scroll-image
                src={section.imageSrc}
                alt={section.alt}
                loading="lazy"
              />
            </div>

            <div className={styles.storyCopy} data-scroll-copy>
              <p>{section.heading}</p>
            </div>
          </section>
        ))}
      </div>
    </section>
  );
};