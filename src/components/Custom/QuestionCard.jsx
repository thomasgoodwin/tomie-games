import { useState } from "react";
import { Blockquote, Card } from "@chakra-ui/react";
import { motion } from "motion/react";
import {
  Button,
  Portal
} from "@chakra-ui/react";
import Overlay from "./Overlay";

const MotionButton = motion(Button);

const customStyles = {
  top: '50%',
  left: '50%',
  right: 'auto',
  bottom: 'auto',
  marginRight: '-50%',
  transform: 'translate(-50%, -50%)',
  width: "50%",
  marginTop: "10%"
};

const QuestionCard = ({ question }) => {
  const [revealed, setRevealed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const onClose = () => {
    setShowModal(false)
  };

  return <Card.Root onClick={() => setShowModal(true)}>
    <Card.Body textAlign='center'>
      <b>
        {question.category}
      </b>
    </Card.Body>
    <Portal>
      {showModal && <div onClick={(e) => e.stopPropagation()}>
        <Overlay />
        <Card.Root className="question-card" style={customStyles}>
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
            <div style={{ width: "100%", gap: "1rem", display: "flex", flexDirection: "column" }}>
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
              <div style={{ display: "flex", justifyContent: 'right' }}>
                {revealed && <Button onClick={() => {

                }}>Assign Points</Button>}
              </div>
            </div>
          </Card.Footer>
        </Card.Root>
      </div>}
    </Portal>
  </Card.Root>
}

export default QuestionCard;