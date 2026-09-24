import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const METHODS = ["clip-in", "tape-in", "keratin", "micro-ring", "weft"] as const;
type Method = (typeof METHODS)[number];

const METHOD_LINKS: Record<Method, string> = {
  "clip-in": "/clip-in-vlasy",
  "tape-in": "/tape-in-vlasy",
  "keratin": "/keratinove-vlasy",
  "micro-ring": "/micro-ring-vlasy",
  "weft": "/tresove-vlasy",
};

const ROWS = ["application", "time", "durability", "damage", "reapplication"] as const;

export async function MethodComparisonTable({ highlightMethod }: { highlightMethod?: Method }) {
  const t = await getTranslations("methodComparison");

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm border-collapse min-w-[600px]">
        <thead>
          <tr>
            <th className="text-left p-3 text-muted font-medium border-b border-line">{t("property")}</th>
            {METHODS.map((method) => (
              <th
                key={method}
                className={`p-3 text-center font-semibold border-b border-line ${
                  highlightMethod === method ? "bg-blush-50 text-rose-deep" : "text-ink"
                }`}
              >
                <Link href={METHOD_LINKS[method] as any} className="hover:text-rose transition-colors">
                  {t(`method.${method}` as any)}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row} className="border-b border-line last:border-0">
              <td className="p-3 text-muted font-medium">{t(`row.${row}` as any)}</td>
              {METHODS.map((method) => (
                <td
                  key={method}
                  className={`p-3 text-center ${
                    highlightMethod === method ? "bg-blush-50 font-medium" : ""
                  }`}
                >
                  {t(`cell.${method}.${row}` as any)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
