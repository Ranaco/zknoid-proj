import React from 'react';
import TickButton from '../../tick_button';

interface StartPopupProps {
  onClick: () => void;
}

const StartPopup = (props: StartPopupProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 top-0 flex items-center justify-center bg-[#00000056]">
      <div className="absolute flex w-[500px] flex-col items-center justify-center rounded-lg border-4 border-[#20d6d7] bg-[#0e6667] px-[20px] py-[30px]">
        <div className="text-center text-[20px] font-bold">
          <p className="mb-[20px]">Select a character to start the game</p>
        </div>
        <TickButton onClick={props.onClick} />
      </div>
    </div>
  );
};

export default StartPopup;
