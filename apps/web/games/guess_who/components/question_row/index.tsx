"use client";
import Image from "next/image";
import React from "react";
import TickButton from "../tick_button";

interface QuestionRowProps {
  onCheck: (index: number) => void;
  questions: string[];
  status: string;
}

const QuestionRow = (props: QuestionRowProps) => {
  const [index, setIndex] = React.useState(0);
  console.log("QuestionRow", props.status);
  return (
    <div className="flex gap-5 mt-[20px]">
      <Image
        src={"/guess-who/images/arrow_default.png"}
        width={50}
        height={50}
        alt="Arrow Left"
        className={`${props.status !== "question" ? "opacity-50" : ""}`}
        onClick={() =>
          setIndex((prev) =>
            prev <= 1 ? props.questions.length - 1 : prev - 1
          )
        }
      />
      <div
        className={
          "border-4 rounded-lg border-white flex-1 flex items-center justify-center text-[20px] font-bold " +
          `${props.status !== "question" ? "opacity-50" : "highlight"}`
        }
      >
        {props.questions[index].replaceAll("_", " ")}
      </div>
      <Image
        src={"/guess-who/images/arrow_default.png"}
        width={50}
        height={50}
        onClick={() =>
          setIndex((prev) => (prev > props.questions.length - 1 ? 0 : prev + 1))
        }
        alt="Arrow Left"
        className={
          "scale-x-[-1] " + `${props.status !== "question" ? "opacity-50" : ""}`
        }
      />
      <TickButton
        check_pressable={props.status === "question"}
        onClick={() => {
          props.onCheck(index);
          setIndex((val) => 0);
        }}
      />
    </div>
  );
};

export default QuestionRow;
