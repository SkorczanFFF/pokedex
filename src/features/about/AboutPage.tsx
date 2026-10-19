import type { ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { LINKS } from "@/app/links";
import { encountersPath, paths, pokemonPath } from "@/app/routes";
import { GbBox, Screen } from "@/components/layout";
import { MenuCursor } from "@/components/menu";
import { lastDexId } from "@/domain/dex";
import { RETRO } from "@/domain/era";
import { typesUpTo } from "@/domain/pokemonTypes";
import { useScrollTopOn } from "@/features/shared/useScrollTopOn";
import plAbilities from "@/i18n/locales/pl/abilities.json";
import plMoves from "@/i18n/locales/pl/moves.json";

/**
 * The two Polish tables load on demand and are never bundled, so their sizes
 * are written down rather than counted: counting would download them.
 * `genus` is how many species have one, `dex` how many have an entry at all.
 */
const POLISH_TABLES = { genus: 1024, dex: 1018, moveTexts: 919 };

/** The alternate forms PokéAPI numbers from 10000 up: `/pokemon` lists this many. */
const FORMS = 326;

/** Every number the page prints, read from the code wherever the code has it. */
const COUNTS = {
  species: lastDexId("ix"),
  forms: FORMS,
  retroSpecies: RETRO.maxDexId,
  retroTypes: typesUpTo(RETRO.maxGen).length,
  plGenus: POLISH_TABLES.genus,
  plDex: POLISH_TABLES.dex,
  plMoveTexts: POLISH_TABLES.moveTexts,
  plMoveNames: Object.keys(plMoves).length,
  plAbilities: Object.keys(plAbilities).length,
};

const SOURCES = [
  { key: "api", name: "PokéAPI", href: LINKS.pokeapi },
  { key: "wiki", name: "Pokémon Wiki PL", href: LINKS.wikiPl },
  { key: "espeak", name: "eSpeak", href: LINKS.espeak },
  { key: "font", name: "Press Start 2P", href: LINKS.font },
  { key: "pokered", name: "pokered", href: LINKS.pokered },
] as const;

/** A Pokémon every reader knows, to show the pages that are about one. */
const EXAMPLE = "meowth";

const POLISH_ROWS = ["dex", "genus", "moveNames", "moveTexts", "abilities"] as const;

const LINK = "underline underline-offset-2 hover:text-dex-red";

const Ext = ({ href, children }: { href: string; children?: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
    {children}
  </a>
);

/** One Gen I text box per subject, headed like a menu line. */
const Box = ({ heading, children }: { heading: string; children: ReactNode }) => (
  <GbBox>
    <h2 className="mb-4 flex items-center gap-2 text-sm">
      <MenuCursor className="opacity-50" />
      {heading}
    </h2>
    <div className="space-y-3 text-xs leading-relaxed">{children}</div>
  </GbBox>
);

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

/** A page of the app and what it lets a reader do, the name being the way there. */
const Page = ({ to, name, children }: { to: string; name: string; children: ReactNode }) => (
  <div>
    <dt>
      <Link to={to} className={LINK}>
        {name}
      </Link>
    </dt>
    <dd className="mt-1">{children}</dd>
  </div>
);

/**
 * What is here, where it comes from and what is left out on purpose: the
 * data PokéAPI carries, the Polish it does not and where that was taken from,
 * what Retro changes, what each page does, and the sources with their licences.
 */
export const AboutPage = () => {
  const { t } = useTranslation();

  // Reached from the footer, so the reader arrives from the bottom of a page.
  useScrollTopOn();

  return (
    <Screen title={t("about.title")} intro={t("about.intro")}>
      <div className="space-y-6">
        <Box heading={t("about.what.heading")}>
          <p>{t("about.what.body", COUNTS)}</p>
        </Box>

        <Box heading={t("about.data.heading")}>
          <p>
            <Trans i18nKey="about.data.lead" components={{ api: <Ext href={LINKS.pokeapi} /> }} />
          </p>
          <Bullets items={t("about.data.items", { returnObjects: true })} />
          <p>
            <Trans
              i18nKey="about.data.sprites"
              components={{ sprites: <Ext href={LINKS.sprites} /> }}
            />
          </p>
        </Box>

        <Box heading={t("about.polish.heading")}>
          <p>{t("about.polish.gap")}</p>
          <p>
            <Trans
              i18nKey="about.polish.source"
              components={{
                wiki: <Ext href={LINKS.wikiPl} />,
                cc: <Ext href={LINKS.wikiLicense} />,
              }}
            />
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[10px]">
            {POLISH_ROWS.map((row) => (
              <div key={row} className="contents">
                <dt className="text-gray-500">{t(`about.polish.counts.${row}`)}</dt>
                <dd>{t(`about.polish.counts.${row}Value`, COUNTS)}</dd>
              </div>
            ))}
          </dl>
          <p>{t("about.polish.ours")}</p>
          <p>{t("about.polish.fallback")}</p>
          <p>{t("about.polish.lazy")}</p>
        </Box>

        <Box heading={t("about.retro.heading")}>
          <p>{t("about.retro.lead")}</p>
          <Bullets items={t("about.retro.items", { returnObjects: true, ...COUNTS })} />
          <p className="text-gray-500">{t("about.retro.note")}</p>
        </Box>

        <Box heading={t("about.can.heading")}>
          <dl className="space-y-3">
            <Page to={paths.list} name={t("list.title")}>
              {t("about.can.list")}
            </Page>
            <Page to={pokemonPath(EXAMPLE)} name="Pokémon">
              {t("about.can.details")}
            </Page>
            <Page to={encountersPath(EXAMPLE)} name={t("encounters.title")}>
              {t("about.can.encounters")}
            </Page>
            <Page to={paths.types} name={t("types.title")}>
              {t("about.can.types")}
            </Page>
            <Page to={paths.versus} name={t("versus.title")}>
              {t("about.can.versus")}
            </Page>
          </dl>
          <p className="text-gray-500">{t("about.can.settings")}</p>
        </Box>

        <Box heading={t("about.not.heading")}>
          <Bullets items={t("about.not.items", { returnObjects: true })} />
        </Box>

        <Box heading={t("about.how.heading")}>
          <p>
            <Trans
              i18nKey="about.how.body"
              components={{
                gh: <Ext href={LINKS.repo} />,
                log: <Ext href={LINKS.changelog} />,
              }}
            />
          </p>
        </Box>

        <Box heading={t("about.credits.heading")}>
          <ul className="space-y-1">
            {SOURCES.map((source) => (
              <li key={source.key}>
                <Ext href={source.href}>{source.name}</Ext>
                {" — "}
                {t(`about.credits.items.${source.key}`)}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-gray-500">{t("about.credits.trademark")}</p>
        </Box>
      </div>
    </Screen>
  );
};
