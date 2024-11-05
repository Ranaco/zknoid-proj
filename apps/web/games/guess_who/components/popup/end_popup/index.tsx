import { CharacterData } from "@/games/guess_who/_data/character_data";
import Image from "next/image";
import React from "react";

interface EndPopupProps {
    character: CharacterData | any;
    winner: number;
}

const EndPopup = (props: EndPopupProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-[#00000056] flex items-center justify-center">
      <div className="absolute border-4 border-[#20d6d7] bg-[#0e6667] rounded-lg px-[20px] py-[30px] w-[500px] flex flex-col items-center justify-center">
        <Image
          src={`/guess-who/characters/character_${props.character.id}.png`}
          width={100}
          height={100}
          alt="Character Image"
        />
        <div className="text-[20px] font-bold text-center">
          <p className="mb-[20px]">
            {props.character?.name.toString()}
          </p>
        </div>
        <div className="text-[20px] font-bold text-center">
          <p className="mb-[20px]">{props.winner == 0 ? "You Won" : "You Lose"}</p>
        </div>
      </div>
    </div>
  );
};

export default EndPopup;
