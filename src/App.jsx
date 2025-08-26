import { useState } from "react";
import { Button, Input, Group, Flex } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import QuestionCard from "./components/Custom/QuestionCard";
import './App.css'
import PlayerList from "./components/Custom/PlayerList";

function App() {
  const [gameInfo, setGameInfo] = useState(undefined);
  const animation = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2 }
  };

  const [playerList, setPlayerList] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");

  const questions = {
    "question-0": {
      "category": "Technology",
      "question": "In 1976, these two college dropouts founded Apple Computer, Inc. ",
      "answer": "Steve Jobs and Steve Wozniak"
    },
    "question-1": {
      "category": "Animals",
      "question": "Weighing up to 2,000 pounds, this is the largest mammal in North America.",
      "answer": "Bison"
    },
    "question-2": {
      "category": "Movies",
      "question": "What year was the original “Jurassic Park” released in theatres? ",
      "answer": "1993"
    },
  };

  return <AnimatePresence mode="wait">
    {gameInfo === undefined ? (
      <motion.div
        key="start-game"
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        {...animation}
      >
        <div style={{ display: "flex", justifyContent: 'center' }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <h1 style={{ fontWeight: "bold", fontSize: "2rem" }}>Player List:</h1>
            <PlayerList players={playerList} />
            <Group attached w="full" maxW="sm">
              <Input
                flex="1"
                placeholder="Name..."
                variant="outline"
                value={newPlayerName}
                onChange={(e) => {
                  setNewPlayerName(e.currentTarget.value)
                }}
              />
              <Button bg="bg.subtle" variant="outline" onClick={() => {
                setPlayerList([newPlayerName, ...playerList]);
                setNewPlayerName("")
              }}>
                Submit
              </Button>
            </Group>
          </div>
        </div>
        <div>
          <Button className="start-game-button" onClick={() => setGameInfo({})} disabled={playerList.length === 0}>
            Start Game
          </Button>
        </div>
      </motion.div>
    ) : (
      <motion.div
        className="game-dashboard"
        key="dashboard"
        {...animation}
      >
        <Flex gap="4" width={"80%"}>
          {Object.keys(questions).map((questionId) => {
            return <QuestionCard
              question={questions[questionId]}
            />
          })}
        </Flex>
      </motion.div>
    )}
  </AnimatePresence>
};

export default App;