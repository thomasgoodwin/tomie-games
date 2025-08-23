import { useState } from "react";
import { Button } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { Flex } from "@chakra-ui/react"
import QuestionCard from "./components/Custom/QuestionCard";
import './App.css'

function App() {
  const [gameInfo, setGameInfo] = useState(undefined);
  const animation = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2 }
  };

  const questions = {
    "question-0": {
      "category": "Technology",
      "question": "In 1976, these two college dropouts founded Apple Computer, Inc. ",
      "answer": "Steve Jobs and Steve Wozniak"
    },
    "question-1": {
      "category": "Animals",
      "question": "Weighing up to 2,000 pounds, this is the largest mammal in North America.",
      "answer": "Johannes Gutenberg"
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
        key="start-gaame"
        {...animation}
      >
        <Button className="start-game-button" onClick={() => setGameInfo({})}>
          Start Game
        </Button>
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