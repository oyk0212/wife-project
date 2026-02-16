import random
from collections import deque
from datetime import datetime

import streamlit as st
import streamlit.components.v1 as components


st.set_page_config(page_title="와이프 열받기 - 술래잡기", page_icon="🔥", layout="wide")

ROOM_W = 15
ROOM_H = 11

FURNITURES = [
    {"name": "식탁", "x": 4, "y": 3, "icon": "🍽️"},
    {"name": "책상", "x": 10, "y": 2, "icon": "🪑"},
    {"name": "장식장", "x": 12, "y": 6, "icon": "🗄️"},
    {"name": "소파", "x": 3, "y": 7, "icon": "🛋️"},
    {"name": "장난감함", "x": 7, "y": 8, "icon": "🧸"},
]


def inject_css() -> None:
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .stApp {
            background: linear-gradient(180deg, #151d31 0%, #213a63 55%, #594a30 100%);
            color: #f8f8f8;
        }
        h1, h2, h3 {
            font-family: "Press Start 2P", monospace !important;
            letter-spacing: 0.02em;
        }
        .panel {
            border: 2px solid #f0c74f;
            border-radius: 12px;
            background: rgba(8, 18, 38, 0.6);
            padding: 0.8rem;
            margin-bottom: 0.8rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(15, 1fr);
            gap: 3px;
            background: rgba(0,0,0,0.2);
            border: 2px solid #121722;
            border-radius: 8px;
            padding: 6px;
        }
        .cell {
            min-height: 30px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            border: 1px solid rgba(0,0,0,0.15);
        }
        .floor { background: #d0b494; }
        .mess { background: #b8673d; }
        .wall { background: #323f5d; }
        .hero { background: #8ad5ff; }
        .wife-calm { background: #ffbdd0; }
        .wife-angry { background: #ff4c4c; animation: shake 0.2s linear infinite; }
        .maze {
            font-family: monospace;
            font-size: 16px;
            line-height: 1.2;
            background: #091227;
            border: 2px solid #f0c74f;
            border-radius: 8px;
            padding: 10px;
            white-space: pre;
        }
        @keyframes shake {
            0% { transform: translate(0,0); }
            25% { transform: translate(-1px, 1px); }
            50% { transform: translate(1px, -1px); }
            75% { transform: translate(-1px, -1px); }
            100% { transform: translate(0,0); }
        }
        @media (max-width: 768px) {
            .cell { min-height: 26px; font-size: 14px; }
            div[data-testid="stButton"] button { min-height: 44px; }
            textarea, input { font-size: 16px !important; }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def game_key(name: str) -> str:
    return f"tag:{name}"


def get_state(name: str, default):
    return st.session_state.get(game_key(name), default)


def set_state(name: str, value) -> None:
    st.session_state[game_key(name)] = value


def generate_maze(width: int = 17, height: int = 17):
    width = width if width % 2 else width + 1
    height = height if height % 2 else height + 1
    maze = [["#" for _ in range(width)] for _ in range(height)]

    def carve(x, y):
        dirs = [(2, 0), (-2, 0), (0, 2), (0, -2)]
        random.shuffle(dirs)
        for dx, dy in dirs:
            nx, ny = x + dx, y + dy
            if 1 <= nx < width - 1 and 1 <= ny < height - 1 and maze[ny][nx] == "#":
                maze[ny][nx] = "."
                maze[y + dy // 2][x + dx // 2] = "."
                carve(nx, ny)

    maze[1][1] = "."
    carve(1, 1)
    maze[height - 2][width - 2] = "E"
    return maze


def init_game() -> None:
    if get_state("initialized", False):
        return

    set_state("initialized", True)
    set_state("mode", "room")
    set_state("dad", (1, 1))
    set_state("wife", (13, 9))
    set_state("wife_anger", 0)
    set_state("turn", 0)
    set_state("caught", False)
    set_state("win", False)
    set_state("furniture_mess", {f["name"]: False for f in FURNITURES})
    set_state("summary", "")
    set_state("maze", None)
    set_state("maze_dad", (1, 1))
    set_state("maze_wife", (1, 1))


def reset_game() -> None:
    for key in list(st.session_state.keys()):
        if key.startswith("tag:"):
            del st.session_state[key]
    init_game()


def wife_step_toward(target, wife, steps=1):
    wx, wy = wife
    tx, ty = target
    for _ in range(steps):
        if wx < tx:
            wx += 1
        elif wx > tx:
            wx -= 1
        elif wy < ty:
            wy += 1
        elif wy > ty:
            wy -= 1
    return wx, wy


def wife_speed_room(anger: int) -> int:
    if anger >= 80:
        return 3
    if anger >= 45:
        return 2
    return 1


def furniture_at(x, y):
    for f in FURNITURES:
        if f["x"] == x and f["y"] == y:
            return f
    return None


def render_room() -> None:
    dad = get_state("dad", (1, 1))
    wife = get_state("wife", (13, 9))
    anger = get_state("wife_anger", 0)
    messy = get_state("furniture_mess", {})

    out = ["<div class='grid'>"]
    for y in range(ROOM_H):
        for x in range(ROOM_W):
            classes = ["cell", "floor"]
            icon = ""

            if x in (0, ROOM_W - 1) or y in (0, ROOM_H - 1):
                classes = ["cell", "wall"]
            else:
                f = furniture_at(x, y)
                if f:
                    if messy[f["name"]]:
                        classes = ["cell", "mess"]
                        icon = "💥"
                    else:
                        icon = f["icon"]

            if (x, y) == dad:
                classes = ["cell", "hero"]
                icon = "🧔"
            if (x, y) == wife:
                classes = ["cell", "wife-angry" if anger >= 45 else "wife-calm"]
                icon = "👩"

            out.append(f"<div class='{' '.join(classes)}'>{icon}</div>")
    out.append("</div>")
    st.markdown("".join(out), unsafe_allow_html=True)


def all_messed() -> bool:
    return all(get_state("furniture_mess", {}).values())


def adjacent_furniture(dad_pos):
    dxdy = [(1, 0), (-1, 0), (0, 1), (0, -1), (0, 0)]
    for dx, dy in dxdy:
        f = furniture_at(dad_pos[0] + dx, dad_pos[1] + dy)
        if f:
            return f
    return None


def move_dad_room(dx, dy) -> None:
    if get_state("mode", "room") != "room":
        return

    dad = get_state("dad", (1, 1))
    nx, ny = dad[0] + dx, dad[1] + dy
    if 1 <= nx < ROOM_W - 1 and 1 <= ny < ROOM_H - 1:
        set_state("dad", (nx, ny))
        advance_room_turn()


def mess_action() -> None:
    if get_state("mode", "room") != "room":
        return

    dad = get_state("dad", (1, 1))
    messy = get_state("furniture_mess", {})
    target = adjacent_furniture(dad)
    if target is None:
        st.warning("근처에 어지를 가구가 없습니다.")
        return
    if messy[target["name"]]:
        st.info("이미 충분히 어질러진 상태입니다.")
        return

    messy[target["name"]] = True
    set_state("furniture_mess", messy)
    set_state("wife_anger", min(100, get_state("wife_anger", 0) + 25))
    advance_room_turn()

    if all_messed():
        start_maze_phase()


def advance_room_turn() -> None:
    turn = get_state("turn", 0) + 1
    set_state("turn", turn)

    dad = get_state("dad", (1, 1))
    wife = get_state("wife", (13, 9))
    anger = get_state("wife_anger", 0)
    speed = wife_speed_room(anger)
    wife = wife_step_toward(dad, wife, steps=speed)
    set_state("wife", wife)

    if wife == dad:
        set_state("caught", True)
        set_state("mode", "end")
        set_summary(False, "거실에서 바로 검거됨")


def start_maze_phase() -> None:
    maze = generate_maze(17, 17)
    set_state("mode", "maze")
    set_state("maze", maze)
    set_state("maze_dad", (1, 1))
    set_state("maze_wife", (1, len(maze) - 2))


def maze_neighbors(maze, pos):
    x, y = pos
    out = []
    for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
        nx, ny = x + dx, y + dy
        if 0 <= ny < len(maze) and 0 <= nx < len(maze[0]) and maze[ny][nx] != "#":
            out.append((nx, ny))
    return out


def bfs_next_step(maze, start, goal):
    if start == goal:
        return start
    q = deque([start])
    prev = {start: None}
    while q:
        cur = q.popleft()
        for nxt in maze_neighbors(maze, cur):
            if nxt not in prev:
                prev[nxt] = cur
                q.append(nxt)
                if nxt == goal:
                    q.clear()
                    break

    if goal not in prev:
        nbs = maze_neighbors(maze, start)
        return random.choice(nbs) if nbs else start

    node = goal
    while prev[node] != start and prev[node] is not None:
        node = prev[node]
    return node


def move_in_maze(dx, dy):
    if get_state("mode", "room") != "maze":
        return

    maze = get_state("maze", None)
    dad = get_state("maze_dad", (1, 1))
    wife = get_state("maze_wife", (1, 1))

    nx, ny = dad[0] + dx, dad[1] + dy
    if maze[ny][nx] != "#":
        dad = (nx, ny)
        set_state("maze_dad", dad)

    wife_next = bfs_next_step(maze, wife, dad)
    set_state("maze_wife", wife_next)

    if wife_next == dad:
        set_state("mode", "end")
        set_state("caught", True)
        set_summary(False, "미로 추격전에서 붙잡힘")
        return

    if maze[dad[1]][dad[0]] == "E":
        set_state("mode", "end")
        set_state("win", True)
        set_summary(True, "모든 가구를 어지르고 미로 탈출 성공")


def maze_text() -> str:
    maze = get_state("maze", None)
    dad = get_state("maze_dad", (1, 1))
    wife = get_state("maze_wife", (1, 1))

    lines = []
    for y, row in enumerate(maze):
        chars = []
        for x, c in enumerate(row):
            if (x, y) == dad:
                chars.append("D")
            elif (x, y) == wife:
                chars.append("W")
            elif c == "#":
                chars.append("█")
            elif c == "E":
                chars.append("🏁")
            else:
                chars.append("·")
        lines.append(" ".join(chars))
    return "\n".join(lines)


def set_summary(success: bool, detail: str) -> None:
    messy_count = sum(1 for v in get_state("furniture_mess", {}).values() if v)
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    result = "Mission Success" if success else "Mission Failed"
    anger = get_state("wife_anger", 0)
    turns = get_state("turn", 0)

    summary = (
        f"[{stamp}] {result} | 와이프 열받기 술래잡기\\n"
        f"- Messed Furniture: {messy_count}/{len(FURNITURES)}\\n"
        f"- Wife Anger Level: {anger}/100\\n"
        f"- Room Turns: {turns}\\n"
        f"- Debrief: {detail}\\n"
        f"#와열하 #2D게임 #술래잡기"
    )
    set_state("summary", summary)


def render_room_controls() -> None:
    col1, col2, col3 = st.columns(3)
    col2.button("⬆️", use_container_width=True, on_click=move_dad_room, args=(0, -1))
    col1.button("⬅️", use_container_width=True, on_click=move_dad_room, args=(-1, 0))
    col2.button("⬇️", use_container_width=True, on_click=move_dad_room, args=(0, 1))
    col3.button("➡️", use_container_width=True, on_click=move_dad_room, args=(1, 0))
    st.button("💣 근처 가구 어지르기", use_container_width=True, on_click=mess_action)


def render_maze_controls() -> None:
    c1, c2, c3 = st.columns(3)
    c2.button("⬆️ Maze", use_container_width=True, on_click=move_in_maze, args=(0, -1))
    c1.button("⬅️ Maze", use_container_width=True, on_click=move_in_maze, args=(-1, 0))
    c2.button("⬇️ Maze", use_container_width=True, on_click=move_in_maze, args=(0, 1))
    c3.button("➡️ Maze", use_container_width=True, on_click=move_in_maze, args=(1, 0))


def render_status_panel():
    messy = get_state("furniture_mess", {})
    anger = get_state("wife_anger", 0)
    messed_count = sum(1 for v in messy.values() if v)
    st.markdown("<div class='panel'>", unsafe_allow_html=True)
    st.subheader("Mission Status")
    st.write(f"- 어지른 가구: {messed_count}/{len(FURNITURES)}")
    st.progress(min(1.0, anger / 100), text=f"Wife Anger: {anger}/100")
    st.write(f"- Turn: {get_state('turn', 0)}")
    for f in FURNITURES:
        state = "💥" if messy[f["name"]] else "✅"
        st.write(f"{state} {f['name']}")
    st.markdown("</div>", unsafe_allow_html=True)


def render_keyboard_3d_mode() -> None:
    html_code = """
    <div style="border:2px solid #f0c74f;border-radius:12px;padding:10px;background:rgba(8,18,38,0.65);">
      <div style="font-weight:700;margin-bottom:8px;">2.5D 실시간 모드 (클릭 후 방향키 조작)</div>
      <div style="font-size:13px;margin-bottom:8px;">
        이동: Arrow 또는 WASD | 어지르기: Space | 재시작: R
      </div>
      <canvas id="game" width="960" height="560" style="width:100%;max-width:960px;border:2px solid #131a2c;border-radius:8px;background:#0e1830;outline:none;" tabindex="0"></canvas>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <button id="btnUp">⬆️</button><button id="btnLeft">⬅️</button><button id="btnDown">⬇️</button>
        <button id="btnRight">➡️</button><button id="btnMess">💥 어지르기</button><button id="btnReset">🔄 재시작</button>
      </div>
      <textarea id="summary" readonly style="margin-top:10px;width:100%;height:110px;border-radius:8px;border:1px solid #223257;background:#0d1529;color:#e9edf8;padding:8px;"></textarea>
    </div>
    <script>
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const summaryEl = document.getElementById("summary");
    const W = canvas.width, H = canvas.height;
    const roomW = 15, roomH = 11;
    const roomRect = {x: 36, y: 58, w: 520, h: 458};

    const furnitureBase = [
      {name:"식탁", x:3.5, y:2.4, w:3.0, h:1.8, color:"#92633d"},
      {name:"책상", x:9.4, y:2.0, w:2.6, h:1.4, color:"#7f5a36"},
      {name:"장식장", x:11.1, y:5.0, w:2.6, h:2.2, color:"#735438"},
      {name:"소파", x:2.2, y:6.3, w:3.5, h:2.0, color:"#6e7fa1"},
      {name:"장난감함", x:7.0, y:7.4, w:2.0, h:1.4, color:"#5d8e66"},
    ];

    function deepReset(){
      return {
        mode:"room",
        dad:{x:1,y:1},
        wife:{x:13,y:9},
        anger:0,
        turn:0,
        hp:3,
        win:false,
        lose:false,
        furniture:furnitureBase.map(f=>({...f,mess:false})),
        maze:null,
        mazeDad:{x:1,y:1},
        mazeWife:{x:1,y:1},
        mazeTurn:0,
        note:""
      };
    }
    let g = deepReset();
    function worldToScreen(x,y){
      const nx = x / roomW;
      const ny = y / roomH;
      const left = roomRect.x + (1-ny) * 34;
      const right = roomRect.x + roomRect.w - (1-ny) * 26;
      const px = left + nx * (right-left);
      const py = roomRect.y + ny * roomRect.h;
      return {x:px, y:py};
    }

    function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
    function darken(hex, n){
      const h = hex.replace("#","");
      const r = parseInt(h.slice(0,2),16), g2=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
      const d=(c)=>Math.max(0,Math.min(255,c+n));
      return `rgb(${d(r)},${d(g2)},${d(b)})`;
    }

    function drawBox(px, py, w, h, color, messy){
      const top = py - h*0.35;
      const depth = 18;
      ctx.fillStyle = darken(color, 20);
      ctx.fillRect(px, top, w, h*0.4);
      ctx.fillStyle = color;
      ctx.fillRect(px, top + h*0.4, w, h*0.6);
      ctx.fillStyle = darken(color, -28);
      ctx.fillRect(px + w - depth, top + 6, depth, h*0.9);
      if(messy){
        ctx.fillStyle = "rgba(210,56,38,0.85)";
        for(let i=0;i<4;i++){
          ctx.beginPath();
          ctx.arc(px + 16 + i*18, top + h*0.45 + (i%2)*6, 6, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }

    function drawCharacter(px, py, color, angry, label){
      const r = 13;
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(px, py+10, 12, 5, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py-r, r, 0, Math.PI*2);
      ctx.fill();
      ctx.fillRect(px-10, py-r+8, 20, 22);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px monospace";
      ctx.fillText(label, px-4, py-r+4);
      if(angry){
        ctx.strokeStyle = "#ff5959";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px-18, py-r-12);
        ctx.lineTo(px-4, py-r-22);
        ctx.lineTo(px+8, py-r-12);
        ctx.stroke();
      }
    }

    function drawRoom(){
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#172648");
      grad.addColorStop(1, "#4e3d2a");
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,W,H);

      ctx.fillStyle = "#6e7897";
      ctx.fillRect(roomRect.x-8, roomRect.y-22, roomRect.w+12, 24);
      ctx.fillStyle = "#d2bc9c";
      ctx.beginPath();
      ctx.moveTo(roomRect.x, roomRect.y);
      ctx.lineTo(roomRect.x + roomRect.w, roomRect.y);
      ctx.lineTo(roomRect.x + roomRect.w - 26, roomRect.y + roomRect.h);
      ctx.lineTo(roomRect.x + 32, roomRect.y + roomRect.h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(84,48,30,0.35)";
      ctx.fillRect(roomRect.x + 120, roomRect.y + 180, 220, 130);
      ctx.fillStyle = "rgba(193,171,122,0.45)";
      ctx.fillRect(roomRect.x + 136, roomRect.y + 196, 188, 98);

      for(const f of g.furniture){
        const p = worldToScreen(f.x, f.y);
        const p2 = worldToScreen(f.x + f.w, f.y + f.h);
        const fw = Math.max(46, p2.x - p.x);
        const fh = Math.max(38, p2.y - p.y + 40);
        ctx.fillStyle = "rgba(0,0,0,0.24)";
        ctx.fillRect(p.x + 8, p2.y - 2, fw - 8, 8);
        drawBox(p.x, p.y - 22, fw, fh, f.color, f.mess);
        ctx.fillStyle = f.mess ? "#ffd0d0" : "#f0e9df";
        ctx.font = "bold 12px monospace";
        ctx.fillText(f.mess ? "난장판!" : f.name, p.x + 6, p.y + 16);
      }

      const dadP = worldToScreen(g.dad.x,g.dad.y);
      const wifeP = worldToScreen(g.wife.x,g.wife.y);
      drawCharacter(dadP.x, dadP.y-10, "#67c8ff", false, "D");
      drawCharacter(wifeP.x, wifeP.y-10, g.anger>=45 ? "#ff4a4a" : "#ffbdd0", g.anger>=45, "W");

      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px monospace";
      const messed = g.furniture.filter(f=>f.mess).length;
      ctx.fillText(`Messed: ${messed}/5`, 24, 30);
      ctx.fillText(`Wife Anger: ${g.anger}/100`, 24, 52);
      ctx.fillText(`Turns: ${g.turn}`, 24, 74);
      ctx.fillStyle = "#fff3a3";
      ctx.fillText(`Lives: ${g.hp}`, 24, 96);
      ctx.fillStyle = g.anger >= 45 ? "#ff7f7f" : "#b8d7ff";
      ctx.fillText(g.anger >= 45 ? "분노 상승! 하지만 지금은 쉬운 모드입니다." : "쉬운 모드: 천천히 어질러도 됩니다.", 24, 118);
    }

    function wifeRoomSpeed(){
      if(g.anger>=75) return 2;
      return 1;
    }

    function stepWifeToward(){
      for(let i=0;i<wifeRoomSpeed();i++){
        if(g.wife.x < g.dad.x) g.wife.x += 1;
        else if(g.wife.x > g.dad.x) g.wife.x -= 1;
        else if(g.wife.y < g.dad.y) g.wife.y += 1;
        else if(g.wife.y > g.dad.y) g.wife.y -= 1;
      }
      if(g.wife.x===g.dad.x && g.wife.y===g.dad.y){
        g.hp -= 1;
        g.wife = {x:13,y:9};
        g.dad = {x:1,y:1};
        if(g.hp <= 0){
          g.mode = "end"; g.lose = true; g.note = "거실에서 3번 잡힘";
        }
      }
    }

    function findNearFurniture(){
      for(const f of g.furniture){
        const cx = f.x + f.w * 0.5;
        const cy = f.y + f.h * 0.5;
        const dist = Math.abs(g.dad.x - cx) + Math.abs(g.dad.y - cy);
        if(dist <= 3.2){
          return f;
        }
      }
      return null;
    }

    function allMessed(){ return g.furniture.every(f=>f.mess); }

    function buildMaze(w,h){
      if(w%2===0) w++; if(h%2===0) h++;
      const m = Array.from({length:h},()=>Array.from({length:w},()=>"#"));
      function carve(x,y){
        const dirs = [[2,0],[-2,0],[0,2],[0,-2]].sort(()=>Math.random()-0.5);
        for(const [dx,dy] of dirs){
          const nx=x+dx, ny=y+dy;
          if(nx>0 && ny>0 && nx<w-1 && ny<h-1 && m[ny][nx]==="#"){
            m[ny][nx]=".";
            m[y+dy/2][x+dx/2]=".";
            carve(nx,ny);
          }
        }
      }
      m[1][1]="."; carve(1,1); m[h-2][w-2]="E";
      return m;
    }

    function startMaze(){
      g.mode = "maze";
      g.maze = buildMaze(17,17);
      g.mazeDad = {x:1,y:1};
      g.mazeWife = {x:1,y:15};
    }

    function mazeNeighbors(m,p){
      const res=[], ds=[[1,0],[-1,0],[0,1],[0,-1]];
      for(const [dx,dy] of ds){
        const nx=p.x+dx, ny=p.y+dy;
        if(ny>=0 && ny<m.length && nx>=0 && nx<m[0].length && m[ny][nx]!=="#") res.push({x:nx,y:ny});
      }
      return res;
    }

    function keyOf(p){ return `${p.x},${p.y}`; }
    function bfsNext(m,start,goal){
      if(start.x===goal.x && start.y===goal.y) return {...start};
      const q=[start], prev=new Map(); prev.set(keyOf(start), null);
      while(q.length){
        const cur=q.shift();
        for(const nx of mazeNeighbors(m,cur)){
          const k=keyOf(nx);
          if(!prev.has(k)){
            prev.set(k,cur); q.push(nx);
            if(nx.x===goal.x && nx.y===goal.y){ q.length=0; break; }
          }
        }
      }
      if(!prev.has(keyOf(goal))){
        const nbs=mazeNeighbors(m,start);
        return nbs.length?nbs[Math.floor(Math.random()*nbs.length)]:start;
      }
      let node = goal;
      while(true){
        const p = prev.get(keyOf(node));
        if(!p) break;
        if(p.x===start.x && p.y===start.y) break;
        node = p;
      }
      return {...node};
    }

    function drawMazeRight(){
      const m = g.maze;
      const ox = 586, oy = 72, ts = 20;
      ctx.fillStyle = "#0a1226";
      ctx.fillRect(568, 44, 360, 470);
      for(let y=0;y<m.length;y++){
        for(let x=0;x<m[0].length;x++){
          const px = ox + x*ts, py = oy + y*ts;
          if(m[y][x]==="#"){ ctx.fillStyle="#2a3d5b"; ctx.fillRect(px,py,ts,ts); }
          else { ctx.fillStyle="#10213d"; ctx.fillRect(px,py,ts,ts); }
          if(m[y][x]==="E"){ ctx.fillStyle="#ffd857"; ctx.fillRect(px+6,py+6,ts-12,ts-12); }
        }
      }
      ctx.fillStyle="#75d5ff";
      ctx.fillRect(ox + g.mazeDad.x*ts + 5, oy + g.mazeDad.y*ts + 5, ts-10, ts-10);
      ctx.fillStyle=g.anger>=45 ? "#ff5252" : "#ffb0c8";
      ctx.fillRect(ox + g.mazeWife.x*ts + 5, oy + g.mazeWife.y*ts + 5, ts-10, ts-10);
      ctx.fillStyle="#f5f8ff";
      ctx.font="bold 13px monospace";
      ctx.fillText("오른쪽 미로 술래잡기", 584, 34);
    }

    function finish(success, note){
      g.mode = "end";
      g.win = success;
      g.lose = !success;
      g.note = note;
      const messed = g.furniture.filter(f=>f.mess).length;
      const now = new Date();
      const stamp = now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0")
        +" "+String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
      summaryEl.value =
        `[${stamp}] ${success ? "Mission Success" : "Mission Failed"} | 와이프 열받기 술래잡기\\n` +
        `- Messed Furniture: ${messed}/5\\n` +
        `- Wife Anger Level: ${g.anger}/100\\n` +
        `- Room Turns: ${g.turn}\\n` +
        `- Debrief: ${note}\\n` +
        `#와열하 #2D게임 #술래잡기`;
    }

    function moveRoom(dx,dy){
      const nx=g.dad.x+dx, ny=g.dad.y+dy;
      if(nx>=1 && nx<roomW-1 && ny>=1 && ny<roomH-1){
        g.dad.x=nx; g.dad.y=ny; g.turn += 1; stepWifeToward();
      }
    }

    function messNow(){
      const f = findNearFurniture();
      if(!f || f.mess || g.mode!=="room") return;
      f.mess = true; g.anger = Math.min(100, g.anger + 15); g.turn += 1; stepWifeToward();
      if(g.mode==="room" && allMessed()) startMaze();
    }

    function moveMaze(dx,dy){
      if(g.mode!=="maze") return;
      const m = g.maze;
      const nx=g.mazeDad.x+dx, ny=g.mazeDad.y+dy;
      if(m[ny] && m[ny][nx] && m[ny][nx]!=="#"){ g.mazeDad.x=nx; g.mazeDad.y=ny; }
      g.mazeTurn += 1;
      if(g.mazeTurn % 2 === 0){
        g.mazeWife = bfsNext(m, g.mazeWife, g.mazeDad);
      }
      if(g.mazeWife.x===g.mazeDad.x && g.mazeWife.y===g.mazeDad.y){ finish(false, "미로에서 붙잡힘"); return; }
      if(m[g.mazeDad.y][g.mazeDad.x]==="E"){ finish(true, "모든 가구를 어지르고 미로 탈출 성공"); }
    }

    function handleMove(dx,dy){
      if(g.mode==="room") moveRoom(dx,dy);
      else if(g.mode==="maze") moveMaze(dx,dy);
    }

    function handleMess(){
      if(g.mode==="room") messNow();
    }

    document.addEventListener("keydown",(e)=>{
      const k=e.key.toLowerCase();
      if(["arrowup","arrowdown","arrowleft","arrowright"," ","w","a","s","d","r"].includes(k)) e.preventDefault();
      if(k==="r"){ g = deepReset(); summaryEl.value=""; return; }
      if(g.mode==="end") return;
      if(g.mode==="room"){
        if(k==="arrowup"||k==="w") moveRoom(0,-1);
        else if(k==="arrowdown"||k==="s") moveRoom(0,1);
        else if(k==="arrowleft"||k==="a") moveRoom(-1,0);
        else if(k==="arrowright"||k==="d") moveRoom(1,0);
        else if(k===" ") messNow();
      }else if(g.mode==="maze"){
        if(k==="arrowup"||k==="w") moveMaze(0,-1);
        else if(k==="arrowdown"||k==="s") moveMaze(0,1);
        else if(k==="arrowleft"||k==="a") moveMaze(-1,0);
        else if(k==="arrowright"||k==="d") moveMaze(1,0);
      }
    }, {passive:false});

    canvas.addEventListener("click", ()=>canvas.focus());
    canvas.addEventListener("mouseenter", ()=>canvas.focus());
    setTimeout(()=>canvas.focus(), 120);

    document.getElementById("btnUp").onclick = ()=>{ handleMove(0,-1); canvas.focus(); };
    document.getElementById("btnDown").onclick = ()=>{ handleMove(0,1); canvas.focus(); };
    document.getElementById("btnLeft").onclick = ()=>{ handleMove(-1,0); canvas.focus(); };
    document.getElementById("btnRight").onclick = ()=>{ handleMove(1,0); canvas.focus(); };
    document.getElementById("btnMess").onclick = ()=>{ handleMess(); canvas.focus(); };
    document.getElementById("btnReset").onclick = ()=>{ g = deepReset(); summaryEl.value=""; canvas.focus(); };

    function tick(t){
      ctx.clearRect(0,0,W,H);
      drawRoom();
      if(g.mode==="maze") drawMazeRight();

      if(g.mode==="room"){
        ctx.fillStyle="#ffe6a4"; ctx.font="bold 14px monospace";
        ctx.fillText("Space: 근처의 가구를 난장판으로 만들기", 22, H-24);
      } else if(g.mode==="maze"){
        ctx.fillStyle="#ffd36a"; ctx.font="bold 14px monospace";
        ctx.fillText("미로 활성화! 오른쪽에서 탈출 지점(노란색)으로 이동", 22, H-24);
      } else {
        ctx.fillStyle = g.win ? "#78f0a8" : "#ff8c8c";
        ctx.font = "bold 24px monospace";
        ctx.fillText(g.win ? "MISSION SUCCESS" : "MISSION FAILED", 290, 286);
        ctx.font = "bold 14px monospace";
        ctx.fillStyle = "#f7f7f7";
        ctx.fillText("R 키로 즉시 재시작", 390, 316);
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    </script>
    """
    components.html(html_code, height=760, scrolling=False)


def main() -> None:
    inject_css()
    init_game()

    st.title("와이프 열받기: 거실 난장판 -> 미로 도주")
    st.caption("가구를 다 어지르면 오른쪽에 미로가 열리고, 빨개진 와이프가 잡으러 옵니다.")
    mode_ui = st.radio(
        "플레이 모드",
        ["2.5D 방향키 실시간 모드", "기존 버튼 조작 모드"],
        horizontal=True,
        index=0,
    )

    if mode_ui == "2.5D 방향키 실시간 모드":
        render_keyboard_3d_mode()
        return

    top1, top2 = st.columns([3, 1])
    with top2:
        if st.button("🔄 게임 초기화", use_container_width=True):
            reset_game()
            st.rerun()

    mode = get_state("mode", "room")

    if mode == "room":
        left, right = st.columns([3, 2])
        with left:
            st.subheader("거실 2D 맵")
            render_room()
            render_room_controls()
        with right:
            render_status_panel()
            st.info("목표: 가구 5개 전부 어지르기. 단, 와이프에게 잡히면 실패.")

    elif mode == "maze":
        left, right = st.columns(2)
        with left:
            st.subheader("거실 상황")
            render_room()
            st.warning("거실이 전장화됨. 비상 탈출 미로가 활성화되었습니다.")
            render_status_panel()
        with right:
            st.subheader("오른쪽 미로: 술래잡기 도주")
            st.markdown(f"<div class='maze'>{maze_text()}</div>", unsafe_allow_html=True)
            st.caption("D=아빠, W=와이프, 🏁=탈출")
            render_maze_controls()

    else:
        win = get_state("win", False)
        if win:
            st.success("Mission Success: 와이프 추격을 뚫고 탈출 완료")
        else:
            st.error("Mission Failed: 와이프에게 붙잡혔습니다")

        summary = get_state("summary", "")
        if summary:
            st.text_area("Threads 공유용 요약", summary, height=180)

        st.button("다시 시작", use_container_width=True, on_click=reset_game)


if __name__ == "__main__":
    main()
