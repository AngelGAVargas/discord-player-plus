import {
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
} from "discord.js";
import type en from "../languages/en.json";
import { PlayerManager } from "../player-manager";

// #region Command
export interface Command<T = boolean> extends ChatInputApplicationCommandData {
  run: (interaction: ChatInputCommandInteraction<"cached">) => Promise<T>;
}
// #endregion Command

export type CreateCommandFunc = (
  playerManager: PlayerManager,
  options?: CreateCommandOptions
) => Command;

// #region CreateCommandOptions
export interface CreateCommandOptions {
  /**
   * Whether messages should only be visible for the user that executed the command.
   *
   * @default `false`
   */
  ephemeral?: boolean;
  /**
   * Whether error messages should only be visible for the user that executed the command.
   *
   * @default `true`
   */
  ephemeralError?: boolean;
}
// #endregion CreateCommandOptions

// #region CreateHelpCommandOptions
export interface CreateHelpCommandOptions {
  /** Title that is being displayed at the top of the help prompt. Markdown supported. */
  title?: string;
  /** URL that the title should be linked to. */
  url?: string;
  /** Description/text inside the help prompt. Markdown supported. */
  description?: string;
  /** Commands that the help prompt should be generated for. Will be sorted alphabetically. */
  commands: Command[];
  /** Information about the author that developed the discord bot. */
  author?: {
    name: string;
    iconUrl?: string;
    url?: string;
  };
  /** Footer text, e.g. to specify the discord bot version. */
  footerText?: string;
}
// #endregion CreateHelpCommandOptions

export type Translations = typeof en;
