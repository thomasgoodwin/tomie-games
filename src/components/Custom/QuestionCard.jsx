import { useRef, useState, useEffect } from "react";
import { Blockquote, Card } from "@chakra-ui/react";
import { motion, transform } from "motion/react";
import {
  Button,
  Portal,
  Menu,
  ColorSwatch
} from "@chakra-ui/react";
import Overlay from "./Overlay";
import { wordToHex } from "@/util";
const MotionButton = motion(Button);



const QuestionCard = ({ questionId, question, players, setPlayerList, disabled, gameState, setGameState }) => {
  const [revealed, setRevealed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef(null);
  const [awardPointsColor, setAwardPointsColor] = useState("black")
  const [removePointsColor, setRemovePointsColor] = useState("black")
  const onClose = () => {
    setShowModal(false)
  };

  const customStyles = {
    top: "50%",
    left: "50%",
    right: 'auto',
    bottom: 'auto',
    width: "50%",
    position: "absolute",
    transform: "translate(-50%, -50%)",
    maxHeight: "90vh",
    overflowX: "hidden",
    overflowY: "auto"
  };

  return <Card.Root onClick={disabled ? undefined : () => setShowModal(true)}>
    <Card.Body textAlign='center'>
      <b style={{ color: disabled ? "black" : "undefined" }}>
        {question.value}
      </b>
    </Card.Body>
    <Portal>
      {showModal && <div onClick={(e) => e.stopPropagation()}>
        <Overlay />
        <Card.Root className="question-card"
          ref={modalRef}
          style={{
            ...customStyles
          }}
        >
          <Card.Header style={{ display: 'flex', justifyContent: "space-between" }}>
            <div style={{ position: "relative" }}>
              <Button variant="outline" size="sm" onClick={() => setShowModal(false)} style={{ width: "50px", right: "0px", position: "absolute", float: "right" }}>
                Close
              </Button>
            </div>
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
              <div style={{ display: "flex", justifyContent: 'space-between' }}>
                <div>
                  <Menu.Root onSelect={(e) => {
                    setRemovePointsColor(e.value)
                  }}>
                    <Menu.Trigger asChild>
                      <Button variant="outline" size="sm">
                        Color <ColorSwatch value={removePointsColor} />
                      </Button>
                    </Menu.Trigger>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content>
                          <Menu.Item value="red">
                            <ColorSwatch value={"#FF3131"} />Red
                          </Menu.Item>
                          <Menu.Item value="blue">
                            <ColorSwatch value={"#002fa7"} />Blue
                          </Menu.Item>
                          <Menu.Item value="yellow">
                            <ColorSwatch value={"#FFF01F "} />Yellow
                          </Menu.Item>
                          <Menu.Item value="white">
                            <ColorSwatch value={"white"} />White
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                  <Button
                    disabled={removePointsColor === "black"}
                    onClick={() => {
                      let copy = structuredClone(players)
                      Object.keys(copy).forEach((player) => {
                        if (copy[player].color === removePointsColor) {
                          copy[player].points -= question.value;
                        }
                      });
                      setPlayerList(copy);
                    }}
                  >
                    Remove Points
                  </Button>
                </div>
                {revealed && <div>
                  <Menu.Root onSelect={(e) => {
                    setAwardPointsColor(e.value)
                  }}>
                    <Menu.Trigger asChild>
                      <Button variant="outline" size="sm">
                        Color <ColorSwatch value={awardPointsColor} />
                      </Button>
                    </Menu.Trigger>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content>
                          <Menu.Item value="red">
                            <ColorSwatch value={"#FF3131"} />Red
                          </Menu.Item>
                          <Menu.Item value="blue">
                            <ColorSwatch value={"#002fa7"} />Blue
                          </Menu.Item>
                          <Menu.Item value="yellow">
                            <ColorSwatch value={"#FFF01F "} />Yellow
                          </Menu.Item>
                          <Menu.Item value="white">
                            <ColorSwatch value={"white"} />White
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                  <Button
                    disabled={awardPointsColor === "black"}
                    onClick={() => {
                      setShowModal(false);
                      let copy = structuredClone(players);
                      Object.keys(copy).forEach((player) => {
                        if (copy[player].color === awardPointsColor) {
                          copy[player].points += question.value;
                        }
                      });
                      setPlayerList(copy);
                      console.log(copy);
                      let gameStateCopy = {};
                      for (var k in gameState) {
                        if (k !== question) {
                          gameStateCopy[k] = gameState[k];
                        }
                      };
                      gameStateCopy[questionId].active = false;
                      setGameState(gameStateCopy);
                    }}
                  >
                    Award Points
                  </Button>
                </div>}
              </div>
            </div>
          </Card.Footer>
        </Card.Root>
      </div>}
    </Portal>
  </Card.Root>
}

export default QuestionCard;