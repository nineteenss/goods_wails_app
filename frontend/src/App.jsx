import { Flex } from "@mantine/core";

import { Providers } from "./Components/Providers/Providers";
import { Toolbar } from "./Components/Toolbar/Toolbar";
import { Table } from "./Components/Table/Table";
import { CurrentVersion } from "./Components/Version/CurrentVersion";
import { AmountCounter } from "./Components/AmountCouter/AmountCounter";
import { Progress } from "@mantine/core";
import { useEffect, useState } from "react";
import { EventsOn } from "../wailsjs/runtime/runtime";

function App() {
  const [downloadPct, setDownloadPct] = useState(null);

  useEffect(() => {
    const off = EventsOn("update:progress", (downloaded, total) => {
      if (!total || total <= 0) {
        setDownloadPct(100); // indeterminate style: will show animated full bar
        return;
      }
      const pct = Math.max(
        0,
        Math.min(100, Math.round((downloaded / total) * 100))
      );
      setDownloadPct(pct);
      if (pct >= 100) {
        // small delay then hide
        setTimeout(() => setDownloadPct(null), 800);
      }
    });
    return () => off && off();
  }, []);

  return (
    <Providers>
      <Flex direction={"column"} gap={30} justify={"space-between"} h={"100%"}>
        <Flex direction={"column"} gap={30} h={"100%"}>
          <Toolbar />
          <Table />
        </Flex>
        <Flex direction={"row"} gap={30} justify={"space-between"}>
          <AmountCounter positions={10} items={100} />
          <CurrentVersion />
        </Flex>
        {downloadPct !== null && (
          <Progress
            value={downloadPct}
            animated
            pos={"absolute"}
            bottom={0}
            left={0}
            right={0}
            radius={0}
          />
        )}
      </Flex>
    </Providers>
  );
}

export default App;
