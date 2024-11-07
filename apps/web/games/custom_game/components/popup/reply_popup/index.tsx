import Image from 'next/image';
import React, { useEffect } from 'react';
import CrossButton from '../../cross_button';
import TickButton from '../../tick_button';
import { question_key } from '@/games/guess_who/_data/character_data';

interface ReplyPopupProps {
  question: string;
  onClick: (answer: boolean) => void;
  character: any;
}

const ReplyPopup = (props: ReplyPopupProps) => {
  const [warning, setWarning] = React.useState(false);

  useEffect(() => {
    if (warning) {
      setTimeout(() => {
        setWarning(false);
      }, 1000);
    }
  }, [warning]);
  return (
    <div className="fixed bottom-0 left-0 right-0 top-0 flex items-center justify-center bg-[#00000056]">
      <div className="relative flex w-[500px] flex-col items-center justify-center rounded-lg border-4 border-[#20d6d7] bg-[#0e6667] px-[20px] py-[30px]">
        <div className="text-center text-[20px] font-bold">
          <p className="mb-[20px]">{props.question.replaceAll('_', ' ')}</p>
        </div>
        {warning && (
          <Image
            src="/guess-who/images/wrong_answer.png"
            width={100}
            height={100}
            className="absolute bottom-0 left-0 right-0 top-0 m-auto"
            alt="Warning"
          />
        )}
        <div className="mt-[20px] flex w-full justify-center gap-20">
          <CrossButton
            onClick={() => {
              if (
                props.character &&
                props.character[question_key(props.question)]
              ) {
                setWarning(true);
              } else {
                props.onClick(false);
              }
            }}
          />
          <TickButton
            onClick={() => {
              if (
                props.character &&
                props.character[question_key(props.question)]
              ) {
                props.onClick(true);
              } else {
                setWarning(true);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ReplyPopup;
