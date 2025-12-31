import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink, useRouteError } from "react-router-dom";

export default function NotFound() {
  const error = useRouteError();

  return (
    <Container maxW="lg" py={24} color={"black"}>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        p={10}
        bg="white"
        shadow="md"
      >
        <VStack spacing={4} textAlign="center">
          <Heading size="2xl">404</Heading>
          <Heading size="md">
            Page Not Found
          </Heading>
          <Text color="gray.600">
            The page you are looking for does not exist or has been moved.
          </Text>
          {error && (
            <Text fontSize="sm" color="gray.500">
              {error.statusText || error.message}
            </Text>
          )}
          <Button
            as={RouterLink}
            to="/"
            colorScheme="blue"
            size="md"
          >
            Go Home
          </Button>
        </VStack>
      </Box>
    </Container>
  );
}
