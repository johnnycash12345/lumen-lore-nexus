export const DecorativeDots = () => {
  const dots = [
    { top: "15%", left: "8%", size: 6 },
    { top: "25%", right: "12%", size: 4 },
    { top: "45%", left: "5%", size: 5 },
    { top: "65%", right: "8%", size: 6 },
    { top: "80%", left: "15%", size: 4 },
    { bottom: "10%", right: "20%", size: 5 },
  ];

  return (
    <>
      {dots.map((dot, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-lumen-glow/60 pointer-events-none"
          style={{
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            top: dot.top,
            bottom: dot.bottom,
            left: dot.left,
            right: dot.right,
          }}
        />
      ))}
    </>
  );
};
