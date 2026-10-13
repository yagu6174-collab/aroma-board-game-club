import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "首页四版" } };

const claim = "几张桌子、几盒游戏，以及一群想放松、想交朋友、想好好享受生活的人。不需要高超的游戏技巧，也不需要刻意找话题。";

function Bar({ light = false }: { light?: boolean }) {
  const color = light ? "text-white/80" : "text-[#1c1917]";
  return (
    <div className={`flex items-center justify-between px-6 py-4 text-[11px] font-bold tracking-[0.14em] ${color}`}>
      <span className={light ? "text-white" : ""}>AROMA</span>
      <span className="flex gap-3">
        <span className={light ? "text-white" : ""}>简</span>
        <span>繁</span>
        <span>EN</span>
        <span>关于</span>
        <span>桌游库</span>
        <span>活动</span>
        <span>联系</span>
      </span>
    </div>
  );
}

export default function DirectionsPage() {
  return (
    <main className="mx-auto max-w-[1180px] px-6 py-12">
      <p className="text-sm font-bold tracking-[0.16em] text-[#78716c]">四版首页</p>
      <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight">同一句话，四种桌上的东西。</h1>
      <p className="mt-4 max-w-2xl text-[#44403c]">
        现在的球、方块和胶囊只说明「这里有物理」。下面四版换掉素材和摆法。字仍是馨香桌游社和那两句主张。动效先不放进来。
      </p>

      <section className="mt-14">
        <p className="text-sm font-bold">甲 · 一张牌桌</p>
        <p className="mt-1 max-w-2xl text-sm text-[#57534e]">绿色台呢、木边、角色牌、筹码、骰子、宝石。标题落在桌心空处，像一张桌卡。画面是俯视的一张桌子，不是黑色虚空。</p>
        <div className="relative mt-4 h-[640px] overflow-hidden rounded-[28px] bg-[#241910]">
          <div className="absolute inset-8 rounded-[48%] border-[18px] border-[#6b4328] bg-[#1e6a43] shadow-[inset_0_0_0_8px_#c4a574]">
            <div className="absolute inset-0 rounded-[46%] bg-[radial-gradient(circle_at_50%_42%,#2f8a58_0%,#1a5c3a_72%)]" />
          </div>
          <Bar light />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-16 text-center text-[#f6f1e7]">
            <p className="text-6xl font-black leading-none tracking-tight">馨香</p>
            <p className="mt-1 text-5xl font-black leading-none">桌游社</p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#f6f1e7]/80">{claim}</p>
            <div className="mt-6 flex gap-3 text-sm font-bold">
              <span className="rounded-full bg-[#f6f1e7] px-5 py-2 text-[#241910]">活动</span>
              <span className="rounded-full border border-[#f6f1e7]/70 px-5 py-2">关于</span>
            </div>
          </div>
          <div className="absolute left-[12%] top-[18%] w-16 rotate-[-16deg] rounded-md bg-[#f7f4ef] px-2 py-3 text-center text-xs font-black text-[#1c1917] shadow">
            村民
          </div>
          <div className="absolute right-[16%] top-[22%] w-16 rotate-[12deg] rounded-md bg-[#1c1917] px-2 py-3 text-center text-xs font-black text-[#f6f1e7] shadow">
            狼人
          </div>
          <div className="absolute bottom-[16%] left-[18%] flex flex-col items-center">
            <span className="h-5 w-14 rounded-full border-4 border-[#f6f1e7] bg-[#b91c1c]" />
            <span className="-mt-1 h-5 w-14 rounded-full border-4 border-white bg-[#1d4ed8]" />
            <span className="-mt-1 h-5 w-14 rounded-full border-4 border-[#f6f1e7] bg-[#171717]" />
          </div>
          <div className="absolute bottom-[18%] right-[18%] grid h-12 w-12 rotate-12 grid-cols-2 place-items-center rounded-md bg-[#f7f4ef] text-[10px] text-[#1c1917] shadow">
            <span>●</span>
            <span>●</span>
            <span>●</span>
            <span>●</span>
          </div>
          <div className="absolute left-[22%] top-[58%] h-14 w-10 rotate-[-8deg] rounded-md bg-[#facc15] shadow" />
          <div className="absolute right-[28%] top-[62%] flex gap-1">
            <span className="h-4 w-4 rounded-full bg-[#e11d48]" />
            <span className="h-4 w-4 rotate-45 bg-[#059669]" />
            <span className="h-4 w-4 rounded-full bg-[#2563eb]" />
          </div>
        </div>
      </section>

      <section className="mt-16">
        <p className="text-sm font-bold">乙 · 六只盒子</p>
        <p className="mt-1 max-w-2xl text-sm text-[#57534e]">素材就是库里的六局：狼人杀、掼蛋、德州扑克、UNO、宝石商人、大富翁。盒子立着、倒着，名字印在盒面上。标题靠左，压在地板上，不居中悬浮。</p>
        <div className="relative mt-4 h-[640px] overflow-hidden bg-[#d7c3a5]">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,#e7d3b4_0_88px,#dcc7a6_88px_92px)]" />
          <Bar />
          <div className="absolute left-10 top-[28%] max-w-sm">
            <p className="text-6xl font-black leading-[0.9] tracking-tight text-[#1c1917]">馨香</p>
            <p className="text-5xl font-black leading-none">桌游社</p>
            <p className="mt-4 text-sm leading-relaxed text-[#44403c]">{claim}</p>
            <div className="mt-5 flex gap-3 text-sm font-bold">
              <span className="rounded-full bg-[#1c1917] px-5 py-2 text-white">活动</span>
              <span className="rounded-full border-2 border-[#1c1917] px-5 py-2">关于</span>
            </div>
          </div>
          <div className="absolute right-[8%] top-[22%] h-52 w-36 rotate-[-6deg] bg-[#f4efe6] shadow-lg">
            <div className="absolute inset-y-0 right-0 w-3 bg-[#e7e0d6]" />
            <p className="px-4 pt-8 text-2xl font-black leading-tight">狼人杀</p>
            <p className="px-4 pt-2 text-xs">第二期</p>
          </div>
          <div className="absolute right-[28%] top-[40%] h-28 w-44 rotate-[8deg] bg-[#b91c1c] text-[#f6f1e7] shadow-lg">
            <p className="px-4 pt-8 text-2xl font-black">掼蛋</p>
          </div>
          <div className="absolute bottom-[12%] right-[18%] h-36 w-40 rotate-[-3deg] bg-[#14532d] text-[#f6f1e7] shadow-lg">
            <p className="px-4 pt-8 text-xl font-black">德州扑克</p>
            <p className="px-4 text-xs">第三期专局</p>
          </div>
          <div className="absolute bottom-[18%] right-[46%] h-24 w-24 rotate-6 bg-[#171717] text-center text-[#f6f1e7] shadow-lg">
            <p className="pt-3 text-sm font-black">UNO</p>
            <div className="mt-2 flex justify-center gap-1">
              <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
              <span className="h-3 w-3 rounded-full bg-[#facc15]" />
              <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
              <span className="h-3 w-3 rounded-full bg-[#3b82f6]" />
            </div>
          </div>
          <div className="absolute right-[6%] bottom-[28%] h-20 w-28 rotate-3 bg-[#1e3a8a] text-[#f6f1e7] shadow">
            <p className="px-3 pt-6 text-sm font-black">宝石商人</p>
          </div>
          <div className="absolute right-[34%] bottom-[8%] h-16 w-32 bg-[#facc15] shadow">
            <p className="px-3 pt-4 text-sm font-black text-[#1c1917]">大富翁</p>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <p className="text-sm font-bold">丙 · 落日角色牌</p>
        <p className="mt-1 max-w-2xl text-sm text-[#57534e]">只留狼人杀的五张身份：村民、预言家、女巫、猎人、狼人。纸是暖的，桌子是窗边的一块平面。数量少，每张都能读。标题放低，像牌上的一行字，不像海报大标题。</p>
        <div className="relative mt-4 h-[640px] overflow-hidden bg-[#f3c7a4]">
          <div className="absolute left-0 top-0 h-full w-[28%] bg-[#f7e2cf]" />
          <div className="absolute left-[6%] top-[16%] h-40 w-28 border-8 border-[#f7f4ef] bg-[#f8d7bc]" />
          <div className="absolute inset-x-0 bottom-0 h-[46%] bg-[#f6eadc]" />
          <Bar />
          <div className="absolute left-1/2 top-[24%] flex -translate-x-1/2 gap-3">
            {[
              ["村民", "-8deg", "#f7f4ef", "#1c1917"],
              ["预言家", "-3deg", "#f7f4ef", "#1c1917"],
              ["女巫", "2deg", "#3f2a28", "#f6f1e7"],
              ["猎人", "6deg", "#f7f4ef", "#1c1917"],
              ["狼人", "11deg", "#1c1917", "#f6f1e7"],
            ].map(([name, rotate, bg, color]) => (
              <div key={name} className="flex h-40 w-24 items-end justify-center rounded-md pb-4 text-sm font-black shadow" style={{ transform: `rotate(${rotate})`, background: bg, color }}>
                {name}
              </div>
            ))}
          </div>
          <div className="absolute bottom-[10%] left-10 right-10">
            <p className="text-5xl font-black tracking-tight text-[#1c1917]">馨香桌游社</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#44403c]">{claim}</p>
            <p className="mt-3 text-xs font-bold tracking-[0.14em] text-[#9a3412]">10.24 · 掼蛋与德扑专局 · 尚未举行</p>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <p className="text-sm font-bold">丁 · 桌上的印刷品</p>
        <p className="mt-1 max-w-2xl text-sm text-[#57534e]">主物体是一张立在桌上的桌卡：双线框、主张、下一场日期、一枚红章。周围是撕下来的日期纸条。它更接近活动启事，而不是玩具。</p>
        <div className="relative mt-4 h-[640px] overflow-hidden bg-[#e7dccb]">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[#c4b49a]" />
          <div className="absolute left-1/2 top-[12%] h-[500px] w-[560px] -translate-x-1/2 bg-[#f7f4ef] px-12 py-10">
            <div className="h-full border-2 border-[#1c1917] px-8 py-8">
              <div className="h-full border border-[#1c1917] px-8 py-8">
                <p className="text-xs font-bold tracking-[0.2em]">AROMA BOARD GAME CLUB</p>
                <p className="mt-8 text-5xl font-black leading-none tracking-tight">馨香</p>
                <p className="text-5xl font-black leading-none">桌游社</p>
                <p className="mt-6 text-sm leading-relaxed">{claim}</p>
                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-[0.14em] text-[#78716c]">下一场</p>
                    <p className="text-lg font-black">2026.10.24</p>
                    <p className="text-sm">掼蛋与德扑专局</p>
                  </div>
                  <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-[#b91c1c] text-center text-xs font-black leading-tight text-[#b91c1c] rotate-[-12deg]">
                    尚未
                    <br />
                    举行
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute left-[8%] top-[30%] w-24 rotate-[-8deg] bg-[#f7f4ef] px-2 py-3 text-xs font-bold shadow">7.18 已结束</div>
          <div className="absolute right-[8%] top-[26%] w-24 rotate-[10deg] bg-[#f7f4ef] px-2 py-3 text-xs font-bold shadow">8.29 已结束</div>
          <div className="absolute bottom-[16%] left-[14%] w-28 rotate-3 bg-[#f7f4ef] px-2 py-3 text-xs font-bold shadow">701 室</div>
          <div className="absolute bottom-[18%] right-[12%] w-28 rotate-[-4deg] bg-[#f7f4ef] px-2 py-3 text-xs font-bold shadow">鸿图道 22 号</div>
        </div>
      </section>
    </main>
  );
}
