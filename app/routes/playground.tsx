import useEmblaCarousel from "embla-carousel-react";

export default function Playground() {
  const [emblaRef] = useEmblaCarousel({
    containScroll: "trimSnaps",
    dragFree: false,
    align: "start",
    slidesToScroll: 3,
  });

  return (
    <div className="embla overflow-hidden" ref={emblaRef}>
      <div className="embla__container grid grid-flow-col grid-rows-3 auto-cols-[100%]">
        <div className="embla__slide">Slide 1</div>
        <div className="embla__slide">Slide 2</div>
        <div className="embla__slide">Slide 3</div>
        <div className="embla__slide">Slide 4</div>
        <div className="embla__slide">Slide 5</div>
        <div className="embla__slide">Slide 6</div>
        <div className="embla__slide">Slide 7</div>
      </div>
    </div>
  );
}
