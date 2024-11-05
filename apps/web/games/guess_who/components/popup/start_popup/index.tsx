import React from "react";
import TickButton from "../../tick_button";

interface StartPopupProps {
    onClick: () => void;
}

const StartPopup = (props: StartPopupProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-[#00000056] flex items-center justify-center">
      <div className="absolute border-4 border-[#20d6d7] bg-[#0e6667] rounded-lg px-[20px] py-[30px] w-[500px] flex flex-col items-center justify-center">
        <div className="text-[20px] font-bold text-center">
          <p className="mb-[20px]">Select a character to start the game</p>
        </div>
        <TickButton onClick={props.onClick} />
      </div>
    </div>
  );
};

export default StartPopup;
