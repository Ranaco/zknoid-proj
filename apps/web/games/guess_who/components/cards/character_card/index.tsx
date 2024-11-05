"use client";
import Image from "next/image";
import React from "react";
import styles from "./index.module.css";
import { CharacterInfo } from "zknoid-chain-dev/dist/src/guess_who/GuessWho";


interface CharacterData {
  [key: string]: any;
}

interface CharacterCardProps {
  id: number;
  character: CharacterData;
  elimated: boolean;
  onChange: (id: CharacterData) => void;
}

const CharacterCard = (props: CharacterCardProps) => {
  return (
    <div className="relative" onClick={() => props.onChange(props.character)}>
      <Image
        src={`/guess-who/images/characters/character_${props.character.id}.png`}
        width={100}
        height={100}
        alt="Game Background"
        className={"m-auto " + styles.image}
      />
      <Image
        src={"/guess-who/images/disable_character.png"}
        width={100}
        height={100}
        alt="Disable Character"
        className={
          "m-auto absolute top-0 left-0 right-0 bg-[#00000099] " +
          (props.elimated ? "" : "hidden")
        }
      />
      <div className="text-[22px] font-bold text-center">
        <p>{props.character.name.toString()}</p>
      </div>
    </div>
  );
};

export default CharacterCard;
