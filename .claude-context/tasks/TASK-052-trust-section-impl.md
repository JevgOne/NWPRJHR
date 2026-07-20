# TASK-052: Trust sekce "Proč neretušujeme fotky" — Implementační plán

## Přehled změn

4 soubory, ~61 řádků celkem. Žádné nové soubory, žádné nové závislosti.

---

## 1. i18n klíče — `messages/cs.json`

**Vložit za řádek 871** (za `"trustQuestionDesc": "Máte dotaz?..."`, před `"careTitle"`):

```json
      "noRetouchTitle": "Proč neretušujeme fotky",
      "noRetouchDesc": "Záměrně nepoužíváme studiové nasvícení ani úpravy fotografií. S vlasy bohužel platí, že každé světlo mění odstín — co na obrazovce vypadá jako teplá blond, může naživo být o tón chladnější. Nechceme, abyste byly překvapené.",
      "noRetouchCta1Title": "Vyfotíme váš konkrétní kus",
      "noRetouchCta1Desc": "Pošleme reálnou fotku přesně toho svazku, který byste dostaly.",
      "noRetouchCta2Title": "Přijedeme ukázat zdarma",
      "noRetouchCta2Desc": "Osobně po Praze — uvidíte odstín na vlastní oči.",
      "noRetouchCta3Title": "Pošlete fotku svých vlasů",
      "noRetouchCta3Desc": "Najdeme ideální shodu a doporučíme správný odstín a délku.",
```

**Edit operace:**
```
old_string: `      "trustQuestionDesc": "Máte dotaz? Napište nám, rádi pomůžeme s výběrem.",\n      "careTitle"`
new_string: `      "trustQuestionDesc": "Máte dotaz? Napište nám, rádi pomůžeme s výběrem.",\n      "noRetouchTitle": "Proč neretušujeme fotky",\n      "noRetouchDesc": "Záměrně nepoužíváme studiové nasvícení ani úpravy fotografií. S vlasy bohužel platí, že každé světlo mění odstín — co na obrazovce vypadá jako teplá blond, může naživo být o tón chladnější. Nechceme, abyste byly překvapené.",\n      "noRetouchCta1Title": "Vyfotíme váš konkrétní kus",\n      "noRetouchCta1Desc": "Pošleme reálnou fotku přesně toho svazku, který byste dostaly.",\n      "noRetouchCta2Title": "Přijedeme ukázat zdarma",\n      "noRetouchCta2Desc": "Osobně po Praze — uvidíte odstín na vlastní oči.",\n      "noRetouchCta3Title": "Pošlete fotku svých vlasů",\n      "noRetouchCta3Desc": "Najdeme ideální shodu a doporučíme správný odstín a délku.",\n      "careTitle"`
```

---

## 2. i18n klíče — `messages/uk.json`

**Vložit za řádek 871** (za `"trustQuestionDesc": "Маєте запитання?..."`, před `"careTitle"`):

```json
      "noRetouchTitle": "Чому ми не ретушуємо фото",
      "noRetouchDesc": "Ми свідомо не використовуємо студійне освітлення та обробку фотографій. З волоссям, на жаль, кожне світло змінює відтінок — те, що на екрані виглядає як тепла блонда, наживо може бути на тон холоднішим. Ми не хочемо, щоб ви були здивовані.",
      "noRetouchCta1Title": "Сфотографуємо ваш конкретний пучок",
      "noRetouchCta1Desc": "Надішлемо реальне фото саме того пучка, який ви отримаєте.",
      "noRetouchCta2Title": "Приїдемо показати безкоштовно",
      "noRetouchCta2Desc": "Особисто по Празі — побачите відтінок на власні очі.",
      "noRetouchCta3Title": "Надішліть фото свого волосся",
      "noRetouchCta3Desc": "Знайдемо ідеальний збіг та порекомендуємо правильний відтінок і довжину.",
```

**Edit operace:**
```
old_string: `      "trustQuestionDesc": "Маєте запитання? Напишіть нам, із задоволенням допоможемо.",\n      "careTitle"`
new_string: `      "trustQuestionDesc": "Маєте запитання? Напишіть нам, із задоволенням допоможемо.",\n      "noRetouchTitle": "Чому ми не ретушуємо фото",\n      "noRetouchDesc": "Ми свідомо не використовуємо студійне освітлення та обробку фотографій. З волоссям, на жаль, кожне світло змінює відтінок — те, що на екрані виглядає як тепла блонда, наживо може бути на тон холоднішим. Ми не хочемо, щоб ви були здивовані.",\n      "noRetouchCta1Title": "Сфотографуємо ваш конкретний пучок",\n      "noRetouchCta1Desc": "Надішлемо реальне фото саме того пучка, який ви отримаєте.",\n      "noRetouchCta2Title": "Приїдемо показати безкоштовно",\n      "noRetouchCta2Desc": "Особисто по Празі — побачите відтінок на власні очі.",\n      "noRetouchCta3Title": "Надішліть фото свого волосся",\n      "noRetouchCta3Desc": "Знайдемо ідеальний збіг та порекомендуємо правильний відтінок і довжину.",\n      "careTitle"`
```

---

## 3. i18n klíče — `messages/ru.json`

**Vložit za řádek 871** (za `"trustQuestionDesc": "Есть вопрос?..."`, před `"careTitle"`):

```json
      "noRetouchTitle": "Почему мы не ретушируем фото",
      "noRetouchDesc": "Мы сознательно не используем студийное освещение и обработку фотографий. С волосами, к сожалению, каждый свет меняет оттенок — то, что на экране выглядит как тёплый блонд, вживую может быть на тон холоднее. Мы не хотим, чтобы вы были разочарованы.",
      "noRetouchCta1Title": "Сфотографируем ваш конкретный пучок",
      "noRetouchCta1Desc": "Пришлём реальное фото именно того пучка, который вы получите.",
      "noRetouchCta2Title": "Приедем показать бесплатно",
      "noRetouchCta2Desc": "Лично по Праге — увидите оттенок своими глазами.",
      "noRetouchCta3Title": "Пришлите фото своих волос",
      "noRetouchCta3Desc": "Найдём идеальное совпадение и порекомендуем правильный оттенок и длину.",
```

**Edit operace:**
```
old_string: `      "trustQuestionDesc": "Есть вопрос? Напишите нам, будем рады помочь.",\n      "careTitle"`
new_string: `      "trustQuestionDesc": "Есть вопрос? Напишите нам, будем рады помочь.",\n      "noRetouchTitle": "Почему мы не ретушируем фото",\n      "noRetouchDesc": "Мы сознательно не используем студийное освещение и обработку фотографий. С волосами, к сожалению, каждый свет меняет оттенок — то, что на экране выглядит как тёплый блонд, вживую может быть на тон холоднее. Мы не хотим, чтобы вы были разочарованы.",\n      "noRetouchCta1Title": "Сфотографируем ваш конкретный пучок",\n      "noRetouchCta1Desc": "Пришлём реальное фото именно того пучка, который вы получите.",\n      "noRetouchCta2Title": "Приедем показать бесплатно",\n      "noRetouchCta2Desc": "Лично по Праге — увидите оттенок своими глазами.",\n      "noRetouchCta3Title": "Пришлите фото своих волос",\n      "noRetouchCta3Desc": "Найдём идеальное совпадение и порекомендуем правильный оттенок и длину.",\n      "careTitle"`
```

---

## 4. JSX sekce — `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

**Vložit za řádek 1031** (za `</div>` uzavírající existing trust guarantees block),
před řádek 1032 (`</div>` uzavírající pravý sloupec).

**Edit operace — old_string:**
```tsx
            </div>
          </div>
        </div>
      </div>

      {/* Care tips + blog link */}
```

**Edit operace — new_string:**
```tsx
            </div>
          </div>

          {/* No-retouch trust section */}
          <div className="rounded-2xl bg-amber-50/50 p-5 space-y-3">
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
              <div>
                <h3 className="text-sm font-bold text-ink">{t("productDetail.noRetouchTitle")}</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">{t("productDetail.noRetouchDesc")}</p>
              </div>
            </div>
            <div className="space-y-1.5 pt-1">
              <Link href="/contact" className="flex items-start gap-2.5 rounded-lg p-2 -mx-2 hover:bg-white/60 transition-colors">
                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zm5.25-12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
                <div>
                  <p className="text-xs font-semibold text-ink">{t("productDetail.noRetouchCta1Title")}</p>
                  <p className="text-[11px] text-muted">{t("productDetail.noRetouchCta1Desc")}</p>
                </div>
              </Link>
              <a href="https://wa.me/420608553103" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 rounded-lg p-2 -mx-2 hover:bg-white/60 transition-colors">
                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                <div>
                  <p className="text-xs font-semibold text-ink">{t("productDetail.noRetouchCta2Title")}</p>
                  <p className="text-[11px] text-muted">{t("productDetail.noRetouchCta2Desc")}</p>
                </div>
              </a>
              <Link href="/contact" className="flex items-start gap-2.5 rounded-lg p-2 -mx-2 hover:bg-white/60 transition-colors">
                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                <div>
                  <p className="text-xs font-semibold text-ink">{t("productDetail.noRetouchCta3Title")}</p>
                  <p className="text-[11px] text-muted">{t("productDetail.noRetouchCta3Desc")}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Care tips + blog link */}
```

**Poznámka:** `Link` z `@/i18n/navigation` je již importován na řádku 2 page.tsx.
Ikony jsou Heroicons 24 outline: camera (hlavní), photo (CTA1), map-pin (CTA2), arrow-up-tray (CTA3).

---

## Přesný kontext pro Edit tool

Pro hledání `old_string` v page.tsx — hledej tento přesný blok (řádky 1030-1036):

```
              <p className="text-xs text-muted mt-0.5">{t("productDetail.trustQuestionDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Care tips + blog link */}
```

---

## Shrnutí

| Soubor | Akce |
|---|---|
| `messages/cs.json` | Přidat 8 klíčů za `trustQuestionDesc` |
| `messages/uk.json` | Přidat 8 klíčů za `trustQuestionDesc` |
| `messages/ru.json` | Přidat 8 klíčů za `trustQuestionDesc` |
| `src/app/[locale]/(public)/offer/[...slug]/page.tsx` | Vložit JSX blok za existing trust block |

**Žádné nové importy.** `Link` z `@/i18n/navigation` je již k dispozici.
