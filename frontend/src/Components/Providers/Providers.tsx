import React from "react";

import { MantineProvider, DEFAULT_THEME } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <MantineProvider theme={DEFAULT_THEME}>
      <Notifications />
      <ModalsProvider>{children}</ModalsProvider>
    </MantineProvider>
  );
};
