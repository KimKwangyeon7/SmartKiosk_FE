import React, { useState, useEffect } from "react";

const Carousel = ({ slides = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 슬라이드 전환 설정 (5초마다 다음 메시지로 이동)
  useEffect(() => {
    if (slides.length > 0) {
      // 슬라이드가 있을 때만 interval 시작
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [slides.length]);

  return (
    <div className="carousel-container">
      {slides.length > 0 ? (
        <div className="carousel-slide">{slides[currentIndex]?.message}</div>
      ) : (
        <div className="carousel-slide">No data available</div>
      )}
    </div>
  );
};

export default Carousel;
