import React from 'react';

const WaitingPopup = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 top-0 flex items-center justify-center bg-[#00000056]">
      <div className="absolute flex w-[500px] flex-col items-center justify-center rounded-lg border-4 border-[#20d6d7] bg-[#0e6667] px-[20px] py-[30px]">
        <div className="text-center text-[20px] font-bold">
          Waiting for Opponent...
        </div>
        <div className="mt-[20px] flex w-full justify-center gap-20">
          <div className="h-20 w-20 animate-spin rounded-full border-b-2 border-t-2 border-[#20d6d7]"></div>
        </div>
      </div>
    </div>
  );
};

export default WaitingPopup;

