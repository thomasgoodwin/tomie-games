import { useState } from "react";
import { Blockquote, Card } from "@chakra-ui/react";
import { motion } from "motion/react";
import { Button } from "@chakra-ui/react";

const MotionButton = motion(Button);

const QuestionCard = ({ question }) => {
  const [revealed, setRevealed] = useState(false);

  return <Card.Root className="question-card">
    <Card.Header>
      <h2>{question.category}</h2>
    </Card.Header>
    <Card.Body>
      <div className="question">
        <Blockquote.Root variant="solid" marginLeft={"1rem"}>
          <Blockquote.Content>
            {question.question}
          </Blockquote.Content>
        </Blockquote.Root>
      </div>
    </Card.Body>
    <Card.Footer>
      <MotionButton
        className={"answer" + (revealed ? " revealed" : "")}
        onClick={() => setRevealed(true)}
        initial={{
          color: "transparent",
          backgroundColor: "white"
        }}
        animate={!revealed ? {
          color: "transparent",
          backgroundColor: "white"
        } : {
          color: "white",
          backgroundColor: "transparent"
        }}
        transition={{ duration: 0.66 }}
      >
        {question.answer}
      </MotionButton>
    </Card.Footer>
  </Card.Root >
}

export default QuestionCard;