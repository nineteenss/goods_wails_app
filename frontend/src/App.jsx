import { Flex } from "@mantine/core";

import { Providers } from "./Components/Providers/Providers";
import { Toolbar } from "./Components/Toolbar/Toolbar";
import { Table } from "./Components/Table/Table";

function App() {
  return (
    <Providers>
      <Flex direction={"column"} gap={30}>
        <Toolbar />
        <Table />
      </Flex>
    </Providers>
  );
}

export default App;
