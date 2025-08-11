import { Flex } from "@mantine/core";

import { Providers } from "./Components/Providers/Providers";
import { Toolbar } from "./Components/Toolbar/Toolbar";
import { Table } from "./Components/Table/Table";
import { CurrentVersion } from "./Components/Version/CurrentVersion";
import { AmountCounter } from "./Components/AmountCouter/AmountCounter";

function App() {
  return (
    <Providers>
      <Flex direction={"column"} gap={30} justify={"space-between"} h={"100%"}>
        <Flex direction={"column"} gap={30} h={"100%"}>
          <Toolbar />
          <Table />
        </Flex>
        <Flex direction={"row"} gap={30} justify={"space-between"}>
          <AmountCounter positions={10} items={100} />
          <CurrentVersion version="1.0.0" />
        </Flex>
      </Flex>
    </Providers>
  );
}

export default App;
