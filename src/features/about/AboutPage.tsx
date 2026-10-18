import { useEffect, type ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { lastDexId } from "@/domain/dex";
import { RETRO } from "@/domain/era";
import { typesUpTo } from "@/domain/pokemonTypes";
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

const REPO = "https://github.com/SkorczanFFF/pokedex";

const SOURCES = [
  { key: "api", name: "PokéAPI", href: "https://pokeapi.co" },
  { key: "wiki", name: "Pokémon Wiki PL", href: "https://pokemon.fandom.com/pl" },
  { key: "espeak", name: "eSpeak", href: "https://espeak.sourceforge.net/" },
  {
    key: "font",
    name: "Press Start 2P",
    href: "https://fonts.google.com/specimen/Press+Start+2P",
  },
  { key: "pokered", name: "pokered", href: "https://github.com/pret/pokered" },
] as const;

const POLISH_ROWS = ["dex", "genus", "moveNames", "moveTexts", "abilities"] as const;

const LINK = "underline underline-offset-2 hover:text-dex-red";

const Ext = ({ href, children }: { href: string; children?: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
    {children}
  </a>
);

/** One Gen I text box per subject, headed like a menu line. */
const Box = ({ heading, children }: { heading: string; children: ReactNode }) => (
  <section className="border-4 border-black bg-white p-4 md:p-6">
    <h2 className="mb-4 flex items-center gap-2 text-sm">
      <span aria-hidden="true" className="opacity-50">
        {">"}
      </span>
      {heading}
    </h2>
    <div className="space-y-3 text-xs leading-relaxed">{children}</div>
  </section>
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
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-3 text-2xl">{t("about.title")}</h1>
      <p className="mb-6 text-xs leading-relaxed text-gray-500">{t("about.intro")}</p>

      <div className="space-y-6">
        <Box heading={t("about.what.heading")}>
          <p>{t("about.what.body", COUNTS)}</p>
        </Box>

        <Box heading={t("about.data.heading")}>
          <p>
            <Trans i18nKey="about.data.lead" components={{ api: <Ext href="https://pokeapi.co" /> }} />
          </p>
          <Bullets items={t("about.data.items", { returnObjects: true })} />
          <p>
            <Trans
              i18nKey="about.data.sprites"
              components={{ sprites: <Ext href="https://github.com/PokeAPI/sprites" /> }}
            />
          </p>
        </Box>

        <Box heading={t("about.polish.heading")}>
          <p>{t("about.polish.gap")}</p>
          <p>
            <Trans
              i18nKey="about.polish.source"
              components={{
                wiki: <Ext href="https://pokemon.fandom.com/pl" />,
                cc: <Ext href="https://www.fandom.com/licensing" />,
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
            <Page to="/" name={t("list.title")}>
              {t("about.can.list")}
            </Page>
            <Page to="/pokemon/meowth" name="Pokémon">
              {t("about.can.details")}
            </Page>
            <Page to="/pokemon/meowth/encounters" name={t("encounters.title")}>
              {t("about.can.encounters")}
            </Page>
            <Page to="/types" name={t("types.title")}>
              {t("about.can.types")}
            </Page>
            <Page to="/versus" name={t("versus.title")}>
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
                gh: <Ext href={REPO} />,
                log: <Ext href={`${REPO}/blob/master/CHANGELOG.md`} />,
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
    </div>
  );
};
