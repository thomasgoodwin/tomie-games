import { useState } from "react";
import { Button, Input, Group, Grid, GridItem } from "@chakra-ui/react";
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

  const [playerList, setPlayerList] = useState({});
  const [newPlayerName, setNewPlayerName] = useState("");
  const [errorMessage, setErrorMessage] = useState(undefined)

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
    "question-3": {
      "category": "Quotes",
      "question": "Who said: Why play if you don't win?",
      "answer": "Terrance Ragasa"
    },
    "question-4": {
      "category": "Music",
      "question": <div>
        <h2>Name the Song</h2>

      </div>,
      "answer": "Bison"
    },
    "question-5": {
      "category": "Gaming",
      "question": "What year was the original “Jurassic Park” released in theatres? ",
      "answer": "1993"
    },
    "question-6": {
      "category": "Lore",
      "question": "In 1976, these two college dropouts founded Apple Computer, Inc. ",
      "answer": "Steve Jobs and Steve Wozniak"
    },
    "question-7": {
      "category": "History",
      "question": "Weighing up to 2,000 pounds, this is the largest mammal in North America.",
      "answer": "Bison"
    },
    "question-8": {
      "category": "Geography",
      "question": "What year was the original “Jurassic Park” released in theatres? ",
      "answer": "1993"
    },
  };
  const maxPlayers = 4;
  let playerCount = Object.keys(playerList).length;
  return <AnimatePresence mode="wait">
    {gameInfo === undefined ? (
      <motion.div
        key="start-game"
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        {...animation}
      >
        <div style={{ display: "flex", justifyContent: 'center' }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center", width: "100%" }}>
            <h1 style={{ fontWeight: "bold", fontSize: "2rem" }}>Player List:</h1>
            <PlayerList players={playerList} setPlayerList={setPlayerList} />
            <Group attached w="full" maxW="sm">
              <Input
                flex="1"
                placeholder="Name..."
                variant="outline"
                value={newPlayerName}
                onChange={(e) => {
                  setNewPlayerName(e.currentTarget.value)
                }}
                disabled={playerCount >= maxPlayers}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerCount < maxPlayers && newPlayerName !== "") {
                    if (playerList[newPlayerName] !== undefined) {
                      setErrorMessage("Unique usernames are required.")
                      return;
                    } else {
                      setErrorMessage(undefined);
                    }
                    let copy = structuredClone(playerList);
                    copy[newPlayerName] = {
                      color: undefined,
                      points: 0
                    }
                    setPlayerList(copy);
                    setNewPlayerName("");
                  }
                }}
              />
              <Button
                bg="bg.subtle"
                variant="outline"
                disabled={playerCount >= maxPlayers || newPlayerName === ""}
                onClick={() => {
                  if (playerList[newPlayerName] !== undefined) {
                    setErrorMessage("Unique usernames are required.")
                    return;
                  } else {
                    setErrorMessage(undefined);
                  }
                  let copy = structuredClone(playerList);
                  copy[newPlayerName] = {
                    color: undefined,
                    points: 0
                  }
                  setPlayerList(copy);
                  setNewPlayerName("");
                }}>
                Submit
              </Button>
            </Group>
            {errorMessage && <div className="error-message">
              {errorMessage}
            </div>}
          </div>
        </div>
        <div>
          <Button className="start-game-button" onClick={() => setGameInfo({})} disabled={playerCount === 0}>
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
        <Grid templateColumns="repeat(3, 1fr)" gap="6">
          {Object.keys(questions).map((questionId) => {
            return <GridItem>
              <QuestionCard
                question={questions[questionId]}
              />
            </GridItem>
          })}
        </Grid>
      </motion.div>
    )}
  </AnimatePresence>
};

export default App;