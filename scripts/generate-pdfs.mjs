import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FONTS_DIR = join(ROOT, 'public', 'fonts');
const OUTPUT_DIR = join(ROOT, 'public', 'docs');

// Ensure output directory exists
mkdirSync(OUTPUT_DIR, { recursive: true });

// Load fonts
const regularFontBytes = readFileSync(join(FONTS_DIR, 'Inter-Regular.ttf'));
const boldFontBytes = readFileSync(join(FONTS_DIR, 'Inter-Bold.ttf'));

// Colors
const BLACK = rgb(0, 0, 0);
const DARK_GRAY = rgb(0.2, 0.2, 0.2);
const GRAY = rgb(0.4, 0.4, 0.4);
const LIGHT_GRAY = rgb(0.85, 0.85, 0.85);
const ACCENT = rgb(0.15, 0.15, 0.15);

// Page dimensions
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 50;
const CONTENT_WIDTH = A4_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

/**
 * Wraps text to fit within maxWidth, returning an array of lines.
 */
function wrapText(text, font, fontSize, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * A helper class to draw text on PDF pages with automatic page breaks.
 */
class PDFWriter {
  constructor(doc, regularFont, boldFont) {
    this.doc = doc;
    this.regularFont = regularFont;
    this.boldFont = boldFont;
    this.page = null;
    this.y = 0;
    this.footerText = '';
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([A4_WIDTH, A4_HEIGHT]);
    this.y = A4_HEIGHT - MARGIN_TOP;
  }

  ensureSpace(needed) {
    if (this.y - needed < MARGIN_BOTTOM + 30) {
      this.drawFooter();
      this.newPage();
    }
  }

  setFooter(text) {
    this.footerText = text;
  }

  drawFooter() {
    if (!this.footerText) return;
    const fontSize = 8;
    const textWidth = this.regularFont.widthOfTextAtSize(this.footerText, fontSize);
    // Draw a thin line
    this.page.drawLine({
      start: { x: MARGIN_LEFT, y: MARGIN_BOTTOM + 15 },
      end: { x: A4_WIDTH - MARGIN_RIGHT, y: MARGIN_BOTTOM + 15 },
      thickness: 0.5,
      color: LIGHT_GRAY,
    });
    this.page.drawText(this.footerText, {
      x: (A4_WIDTH - textWidth) / 2,
      y: MARGIN_BOTTOM + 4,
      size: fontSize,
      font: this.regularFont,
      color: GRAY,
    });
  }

  drawTitle(text) {
    const fontSize = 20;
    const lines = wrapText(text, this.boldFont, fontSize, CONTENT_WIDTH);
    for (const line of lines) {
      this.ensureSpace(fontSize + 6);
      this.page.drawText(line, {
        x: MARGIN_LEFT,
        y: this.y,
        size: fontSize,
        font: this.boldFont,
        color: ACCENT,
      });
      this.y -= fontSize + 6;
    }
    this.y -= 4;
  }

  drawSubtitle(text) {
    const fontSize = 9;
    const lines = wrapText(text, this.regularFont, fontSize, CONTENT_WIDTH);
    for (const line of lines) {
      this.ensureSpace(fontSize + 4);
      this.page.drawText(line, {
        x: MARGIN_LEFT,
        y: this.y,
        size: fontSize,
        font: this.regularFont,
        color: GRAY,
      });
      this.y -= fontSize + 4;
    }
    this.y -= 2;
  }

  drawHorizontalRule() {
    this.ensureSpace(12);
    this.page.drawLine({
      start: { x: MARGIN_LEFT, y: this.y },
      end: { x: A4_WIDTH - MARGIN_RIGHT, y: this.y },
      thickness: 0.75,
      color: LIGHT_GRAY,
    });
    this.y -= 12;
  }

  drawSectionHeading(text) {
    const fontSize = 12;
    this.ensureSpace(fontSize + 20);
    this.y -= 8;
    this.page.drawText(text, {
      x: MARGIN_LEFT,
      y: this.y,
      size: fontSize,
      font: this.boldFont,
      color: ACCENT,
    });
    this.y -= fontSize + 6;
  }

  drawParagraph(text, { indent = 0, fontSize = 9.5 } = {}) {
    const maxWidth = CONTENT_WIDTH - indent;
    const lines = wrapText(text, this.regularFont, fontSize, maxWidth);
    const lineHeight = fontSize + 3.5;
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.page.drawText(line, {
        x: MARGIN_LEFT + indent,
        y: this.y,
        size: fontSize,
        font: this.regularFont,
        color: DARK_GRAY,
      });
      this.y -= lineHeight;
    }
    this.y -= 4;
  }

  drawBullet(text, { indent = 12, fontSize = 9.5, bullet = '•' } = {}) {
    const bulletWidth = this.regularFont.widthOfTextAtSize(`${bullet} `, fontSize);
    const maxWidth = CONTENT_WIDTH - indent - bulletWidth;
    const lines = wrapText(text, this.regularFont, fontSize, maxWidth);
    const lineHeight = fontSize + 3.5;

    this.ensureSpace(lineHeight);
    this.page.drawText(bullet, {
      x: MARGIN_LEFT + indent,
      y: this.y,
      size: fontSize,
      font: this.regularFont,
      color: DARK_GRAY,
    });

    for (let i = 0; i < lines.length; i++) {
      this.ensureSpace(lineHeight);
      this.page.drawText(lines[i], {
        x: MARGIN_LEFT + indent + bulletWidth,
        y: this.y,
        size: fontSize,
        font: this.regularFont,
        color: DARK_GRAY,
      });
      this.y -= lineHeight;
    }
    this.y -= 1;
  }

  drawNumberedItem(number, text, { indent = 12, fontSize = 9.5 } = {}) {
    const prefix = `${number}. `;
    const prefixWidth = this.regularFont.widthOfTextAtSize(prefix, fontSize);
    const maxWidth = CONTENT_WIDTH - indent - prefixWidth;
    const lines = wrapText(text, this.regularFont, fontSize, maxWidth);
    const lineHeight = fontSize + 3.5;

    this.ensureSpace(lineHeight);
    this.page.drawText(prefix, {
      x: MARGIN_LEFT + indent,
      y: this.y,
      size: fontSize,
      font: this.regularFont,
      color: DARK_GRAY,
    });

    for (let i = 0; i < lines.length; i++) {
      this.ensureSpace(lineHeight);
      this.page.drawText(lines[i], {
        x: MARGIN_LEFT + indent + prefixWidth,
        y: this.y,
        size: fontSize,
        font: this.regularFont,
        color: DARK_GRAY,
      });
      this.y -= lineHeight;
    }
    this.y -= 1;
  }

  drawFormField(label) {
    const fontSize = 10;
    const lineHeight = fontSize + 6;
    this.ensureSpace(lineHeight + 10);

    this.page.drawText(label, {
      x: MARGIN_LEFT,
      y: this.y,
      size: fontSize,
      font: this.regularFont,
      color: DARK_GRAY,
    });

    // Underline for form field
    const labelWidth = this.regularFont.widthOfTextAtSize(label + ' ', fontSize);
    const lineStartX = MARGIN_LEFT + labelWidth;
    const lineEndX = A4_WIDTH - MARGIN_RIGHT;

    if (lineEndX > lineStartX + 20) {
      this.page.drawLine({
        start: { x: lineStartX, y: this.y - 2 },
        end: { x: lineEndX, y: this.y - 2 },
        thickness: 0.5,
        color: GRAY,
      });
    }

    this.y -= lineHeight + 8;
  }

  drawBoldParagraph(text, { fontSize = 9.5 } = {}) {
    const lines = wrapText(text, this.boldFont, fontSize, CONTENT_WIDTH);
    const lineHeight = fontSize + 3.5;
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.page.drawText(line, {
        x: MARGIN_LEFT,
        y: this.y,
        size: fontSize,
        font: this.boldFont,
        color: DARK_GRAY,
      });
      this.y -= lineHeight;
    }
    this.y -= 4;
  }

  spacer(h = 6) {
    this.y -= h;
  }

  finalize() {
    // Draw footer on all pages
    const pages = this.doc.getPages();
    for (const p of pages) {
      if (!this.footerText) continue;
      const fontSize = 8;
      const textWidth = this.regularFont.widthOfTextAtSize(this.footerText, fontSize);
      p.drawLine({
        start: { x: MARGIN_LEFT, y: MARGIN_BOTTOM + 15 },
        end: { x: A4_WIDTH - MARGIN_RIGHT, y: MARGIN_BOTTOM + 15 },
        thickness: 0.5,
        color: LIGHT_GRAY,
      });
      p.drawText(this.footerText, {
        x: (A4_WIDTH - textWidth) / 2,
        y: MARGIN_BOTTOM + 4,
        size: fontSize,
        font: this.regularFont,
        color: GRAY,
      });
    }
  }
}

// ==========================================
// 1. REKLAMAČNÍ ŘÁD
// ==========================================
async function generateReklamacniRad() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const regularFont = await doc.embedFont(regularFontBytes);
  const boldFont = await doc.embedFont(boldFontBytes);

  const w = new PDFWriter(doc, regularFont, boldFont);
  w.setFooter('info@hairland.cz  |  hairland.cz  |  +420 XXX XXX XXX');

  w.drawTitle('Reklamační řád — Hairland.cz');
  w.drawSubtitle('Altro servis group s.r.o.  |  IČO 23673389  |  Školská 660/3, 110 00 Praha 1');
  w.drawSubtitle('Účinný od 26. 9. 2026');
  w.drawHorizontalRule();

  // A1
  w.drawSectionHeading('A1 — Úvodní ustanovení');
  w.drawParagraph('Tento reklamační řád upravuje postup při uplatňování práv z vadného plnění (dále „reklamace") zboží zakoupeného v internetovém obchodě hairland.cz, provozovaném společností Altro servis group s.r.o. Prodávající prodává výhradně nezpracované pravé lidské vlasy (raw hair). Následné zpracování (clip-in, tape-in, keratin, micro ring) zajišťuje prodávající jako zprostředkovatel a za kvalitu zpracování odpovídá zpracovatel. Reklamační řád rozlišuje kupující-podnikatele (B2B) a spotřebitele s odlišnými právními režimy.');

  // A2
  w.drawSectionHeading('A2 — Charakteristika zboží a přípustné odchylky');
  w.drawParagraph('Přirozené lidské vlasy vykazují variabilitu. Za vadu se nepovažuje:');
  w.drawBullet('mírný rozdíl v odstínu oproti fotografii (displeje zobrazují barvy odlišně)');
  w.drawBullet('odchylka hmotnosti ±5 %');
  w.drawBullet('odchylka délky ±2 cm');
  w.drawBullet('přirozená změna textury po umytí');
  w.drawBullet('mírné vypadávání do 5 % objemu za měsíc');

  // A3
  w.drawSectionHeading('A3 — Povinná kontrola při převzetí');
  w.drawParagraph('Kupující je povinen zboží prozkoumat ihned po převzetí a vždy před aplikací. Kontrolujte: odstín, délku, hmotnost, strukturu a neporušenost hygienické pečeti. Aplikací vlasů kupující potvrzuje, že zboží v těchto vlastnostech odpovídá objednávce. Podnikatelé musí vady vytknout do 3 pracovních dnů od převzetí.');

  // A4
  w.drawSectionHeading('A4 — Uznatelné reklamace');
  w.drawParagraph('Za vadu lze uznat:');
  w.drawBullet('dodání jiného zboží než objednaného');
  w.drawBullet('nadměrné vypadávání (více než 15 % objemu za měsíc při dodržení péče)');
  w.drawBullet('vadu materiálu zjistitelnou až po první aplikaci (např. nerovnoměrná struktura po celé délce)');

  // A5
  w.drawSectionHeading('A5 — Neuznatelné reklamace');
  w.drawParagraph('Reklamaci nelze uznat u:');
  w.drawBullet('poškození nedostatečnou nebo nesprávnou péčí');
  w.drawBullet('tepelného či chemického poškození');
  w.drawBullet('poškození nesprávnou aplikací třetí stranou');
  w.drawBullet('přirozených vlastností vlasů (bod A2)');
  w.drawBullet('vad způsobených vnějšími vlivy (chlor, slaná voda, přímé slunce)');
  w.drawBullet('porušení hygienické pečeti bez předchozí kontroly');

  // A6
  w.drawSectionHeading('A6 — Lhůty pro uplatnění reklamace');
  w.drawParagraph('Podnikatelé: 3 pracovní dny na zjevné vady od převzetí; 6 měsíců na skryté vady.');
  w.drawParagraph('Spotřebitelé: 24 měsíců od převzetí; v prvních 12 měsících se má za to, že vada existovala již při převzetí (důkazní břemeno na prodávajícím).');

  // A7
  w.drawSectionHeading('A7 — Postup při reklamaci');
  w.drawParagraph('Reklamaci uplatněte e-mailem na info@hairland.cz. Uveďte:');
  w.drawBullet('číslo objednávky');
  w.drawBullet('popis vady');
  w.drawBullet('fotodokumentaci (min. 3 fotografie vady)');
  w.drawBullet('seznam používaných přípravků a popis péče');
  w.drawParagraph('Po přijetí obdržíte potvrzení s číslem reklamace.');

  // A8
  w.drawSectionHeading('A8 — Vyřízení reklamace');
  w.drawParagraph('Lhůta pro vyřízení: 30 kalendářních dnů pro spotřebitele (až 60 dnů, pokud je nutné odborné posouzení). Uznané reklamace se řeší:');
  w.drawBullet('výměnou za stejné zboží');
  w.drawBullet('přiměřenou slevou z kupní ceny');
  w.drawBullet('vrácením kupní ceny (u aplikovaných vlasů snížené o opotřebení)');

  // A9
  w.drawSectionHeading('A9 — Vrácení zboží k reklamaci');
  w.drawParagraph('Zboží k reklamaci zašlete na adresu provozovny nebo předejte osobně po dohodě. Náklady na dopravu nese kupující; v případě uznané reklamace budou proplaceny.');

  // A10
  w.drawSectionHeading('A10 — Orientační životnost');
  w.drawBullet('Keratin: 3–6 měsíců');
  w.drawBullet('Tape-in pásky: 6–8 týdnů (nutné přelepení)');
  w.drawBullet('Clip-in: 6–12 měsíců');
  w.drawBullet('Micro ring: 3–4 měsíce');
  w.drawParagraph('Uvedené hodnoty jsou orientační a nezakládají právo na reklamaci.');

  // A11
  w.drawSectionHeading('A11 — Mimosoudní řešení sporů');
  w.drawParagraph('Spotřebitel má právo na mimosoudní řešení sporu prostřednictvím České obchodní inspekce (coi.cz).');

  // A12
  w.drawSectionHeading('A12 — Odstoupení od smlouvy');
  w.drawParagraph('Spotřebitel může odstoupit od smlouvy do 14 dnů od převzetí zboží, pokud neporušil hygienickou pečeť a zboží zůstalo nepoužité. Formulář je k dispozici na hairland.cz/odstoupeni-od-smlouvy.');

  w.finalize();

  const pdfBytes = await doc.save();
  const outputPath = join(OUTPUT_DIR, 'reklamacni-rad.pdf');
  writeFileSync(outputPath, pdfBytes);
  console.log(`  reklamacni-rad.pdf (${(pdfBytes.length / 1024).toFixed(1)} KB, ${doc.getPageCount()} pages)`);
}

// ==========================================
// 2. NÁVOD NA PÉČI
// ==========================================
async function generateNavodNaPeci() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const regularFont = await doc.embedFont(regularFontBytes);
  const boldFont = await doc.embedFont(boldFontBytes);

  const w = new PDFWriter(doc, regularFont, boldFont);
  w.setFooter('hairland.cz  |  info@hairland.cz');

  w.drawTitle('Návod na péči o prodloužené vlasy');
  w.drawSubtitle('Hairland.cz — prémiové vlasy k prodloužení');
  w.drawHorizontalRule();

  // Základní poučení
  w.drawSectionHeading('Základní poučení');
  w.drawParagraph('Prodloužené vlasy jsou pravé lidské vlasy, ale nerostou z vaší hlavy — nemají přístup k přirozenému kožnímu mazu. Proto vyžadují pravidelnou vnější výživu a šetrné zacházení.');

  // 1. Kontrola při převzetí
  w.drawSectionHeading('1. Kontrola při převzetí');
  w.drawParagraph('Ihned po převzetí zboží zkontrolujte odstín, délku, hmotnost a strukturu. Vše zdokumentujte fotografií. Případné nesrovnalosti reklamujte PŘED aplikací.');

  // 2. Mytí vlasů
  w.drawSectionHeading('2. Mytí vlasů (2–3× týdně)');
  w.drawBullet('Používejte vlažnou vodu (ne horkou).');
  w.drawBullet('Šampon bez sulfátů nanášejte pouze na kořínky.');
  w.drawBullet('Jemně masírujte — netřete a nežmolte.');
  w.drawBullet('Důkladně opláchněte.');
  w.drawBullet('Nikdy nemyjte vlasy se skloněnou hlavou — směr vody vždy od kořínků ke konečkům.');

  // 3. Výživa vlasů
  w.drawSectionHeading('3. Výživa vlasů');
  w.drawBullet('Kondicionér: po každém mytí, od poloviny délek ke konečkům.');
  w.drawBullet('Maska: 1× týdně, nechat působit 10–15 minut.');
  w.drawBullet('Olej na konečky: 2–3× týdně na suché konečky.');
  w.drawBullet('Hydratační ampule: 1× za 14 dní pro intenzivní regeneraci.');

  // 4. Rozčesávání
  w.drawSectionHeading('4. Rozčesávání (2× denně)');
  w.drawBullet('Používejte speciální kartáč na prodloužené vlasy (Loop Brush).');
  w.drawBullet('Česejte vždy odspodu nahoru — nikdy ne od kořínků dolů.');
  w.drawBullet('Nikdy nečesejte mokré vlasy — nejdříve jemně vyžďímejte ručníkem.');
  w.drawBullet('Před spaním vlasy rozčešte a spleťte do volného copu.');

  // 5. Tepelná úprava
  w.drawSectionHeading('5. Tepelná úprava');
  w.drawBullet('Maximální teplota: 180 °C.');
  w.drawBullet('Vždy používejte termoochranný přípravek.');
  w.drawBullet('Žehličku a kulmu držte min. 3 cm od spojů.');
  w.drawBullet('Fén: přednostně studený vzduch, nikdy přímo na spoje.');

  // 6. Spánek
  w.drawSectionHeading('6. Spánek');
  w.drawBullet('Před spaním vlasy rozčešte a spleťte do volného copu nebo drdolu.');
  w.drawBullet('Používejte saténový polštář nebo čepec — bavlna vlasy vysušuje.');

  // 7. Sport a voda
  w.drawSectionHeading('7. Sport a voda');
  w.drawBullet('Při sportu vlasy stáhněte, aby se netřely.');
  w.drawBullet('Bazén: před vstupem vlasy namočte čistou vodou a naneste ochranný olej. Po bazénu ihned umyjte.');
  w.drawBullet('Moře: stejný postup jako bazén.');
  w.drawBullet('Sauna: chraňte vlasy ručníkem.');

  // 8. Barvení
  w.drawSectionHeading('8. Barvení');
  w.drawBullet('Barvení provádějte výhradně u kadeřníka/kadeřnice.');
  w.drawBullet('Barvit lze pouze na tmavší odstín — zesvětlování a odbarvování NENÍ MOŽNÉ.');
  w.drawBullet('Ideálně barvit před aplikací.');

  // 9. Pravidelná údržba
  w.drawSectionHeading('9. Pravidelná údržba');
  w.drawBullet('Keratin: kontrola a přetažení po 3–4 měsících.');
  w.drawBullet('Tape-in: přelepení každých 6–8 týdnů.');
  w.drawBullet('Micro ring: posun kroužků každé 3–4 měsíce.');
  w.drawBullet('Clip-in: po každém nošení jemně rozčesat a uložit.');

  // 10 věcí
  w.drawSectionHeading('10 věcí, které vlasy zničí');
  w.drawNumberedItem(1, 'Žehlení nad 180 °C bez termoochrany');
  w.drawNumberedItem(2, 'Sulfátové šampony');
  w.drawNumberedItem(3, 'Spánek s rozpuštěnými vlasy');
  w.drawNumberedItem(4, 'Česání mokrých vlasů');
  w.drawNumberedItem(5, 'Odbarvování nebo zesvětlování');
  w.drawNumberedItem(6, 'Chlor bez předchozí ochrany');
  w.drawNumberedItem(7, 'Mytí vlasů se skloněnou hlavou');
  w.drawNumberedItem(8, 'Přílišné mytí (denně)');
  w.drawNumberedItem(9, 'Zanedbání pravidelné údržby spojů');
  w.drawNumberedItem(10, 'Nedostatečná výživa (vynechávání kondicionéru a masek)');

  w.finalize();

  const pdfBytes = await doc.save();
  const outputPath = join(OUTPUT_DIR, 'navod-na-peci.pdf');
  writeFileSync(outputPath, pdfBytes);
  console.log(`  navod-na-peci.pdf (${(pdfBytes.length / 1024).toFixed(1)} KB, ${doc.getPageCount()} pages)`);
}

// ==========================================
// 3. FORMULÁŘ ODSTOUPENÍ
// ==========================================
async function generateFormularOdstoupeni() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const regularFont = await doc.embedFont(regularFontBytes);
  const boldFont = await doc.embedFont(boldFontBytes);

  const w = new PDFWriter(doc, regularFont, boldFont);
  w.setFooter('hairland.cz  |  info@hairland.cz');

  w.drawTitle('Vzorový formulář pro odstoupení od smlouvy');
  w.drawSubtitle('Dle § 1829 občanského zákoníku');
  w.drawHorizontalRule();
  w.spacer(6);

  // Addressee block
  w.drawBoldParagraph('Adresát:');
  w.drawParagraph('Altro servis group s.r.o.');
  w.drawParagraph('Školská 660/3, 110 00 Praha 1');
  w.drawParagraph('IČO: 23673389');
  w.drawParagraph('E-mail: info@hairland.cz');
  w.spacer(10);

  w.drawHorizontalRule();
  w.spacer(4);

  w.drawParagraph('Oznamuji, že tímto odstupuji od smlouvy o nákupu tohoto zboží:', { fontSize: 10 });
  w.spacer(10);

  // Form fields
  w.drawFormField('Zboží (typ, odstín, délka, hmotnost):');
  w.drawFormField('Číslo objednávky:');
  w.drawFormField('Datum objednání:');
  w.drawFormField('Datum převzetí:');
  w.spacer(10);

  w.drawFormField('Jméno a příjmení spotřebitele:');
  w.drawFormField('Adresa spotřebitele:');
  w.drawFormField('E-mail:');
  w.drawFormField('Telefon:');
  w.drawFormField('Číslo účtu pro vrácení peněz:');
  w.spacer(10);

  w.drawFormField('Datum:');
  w.drawFormField('Podpis:');
  w.spacer(16);

  w.drawHorizontalRule();
  w.spacer(4);

  // Important info
  w.drawSectionHeading('Důležité informace');
  w.drawBullet('Zboží zašlete do 14 dnů od odeslání tohoto oznámení na adresu prodávajícího.');
  w.drawBullet('Přijímáme pouze nepoužité, neaplikované a neupravené vlasy s neporušenou hygienickou pečetí.');
  w.drawBullet('Náklady na vrácení zboží nese spotřebitel.');
  w.drawBullet('Peníze vrátíme do 14 dnů stejným způsobem, jakým jsme je přijali.');

  w.finalize();

  const pdfBytes = await doc.save();
  const outputPath = join(OUTPUT_DIR, 'formular-odstoupeni.pdf');
  writeFileSync(outputPath, pdfBytes);
  console.log(`  formular-odstoupeni.pdf (${(pdfBytes.length / 1024).toFixed(1)} KB, ${doc.getPageCount()} pages)`);
}

// ==========================================
// MAIN
// ==========================================
async function main() {
  console.log('Generating PDFs with Czech diacritics support (Inter font)...\n');

  await generateReklamacniRad();
  await generateNavodNaPeci();
  await generateFormularOdstoupeni();

  console.log('\nAll 3 PDFs generated successfully in public/docs/');
}

main().catch((err) => {
  console.error('Error generating PDFs:', err);
  process.exit(1);
});
