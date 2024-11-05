import Image from "next/image";
import React from "react";

const CrossButton = (props: any) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...props}
      className="flex items-center justify-center"
    >
      <Image
        src={hover ? "/guess-who/images/cross_correct.png" : "/guess-who/images/cross_default.png"}
        width={50}
        height={50}
        alt="Tick"
        className={
          "object-contain " + (props.check_pressable ? "highlight" : "")
        }
      />
    </div>
  );
};

export default CrossButton;
