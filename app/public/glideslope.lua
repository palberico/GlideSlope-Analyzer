-- Glide Slope Indicator v3.4  (EdgeTX Tools script) -- CDI + LOGGING + TEST MODE
-- Home is captured AUTOMATICALLY when you open the tool (stand at your
-- launch/landing spot). Choose AUTOMATIC or MANUAL heading on the setup
-- screen before flying:
--   AUTOMATIC locks heading from GPS during into-wind climb-out -- best for
--   wheeled takeoffs where groundspeed ramps up smoothly down a runway.
--   MANUAL lets you dial in the runway/launch heading yourself (0-355 deg,
--   5 deg steps) -- use this for hand launches, where a hard throw can spike
--   groundspeed past the auto-lock threshold before GPS course has settled,
--   locking onto noise from the throw instead of the real flight path.
-- In flight, the SD switch DOWN shows the ILS needles.
--
-- BENCH TEST MODE (automatic heading only): press ENTER (roller click) to
-- lock heading to the plane's CURRENT direction and show the ILS right away
-- -- no groundspeed needed. Then physically move/walk the plane to watch the
-- needles swing. "TEST" shows on screen. Press ENTER again to re-grab the
-- current heading.
--
-- SAVE PROTECTION: writes to /LOGS/ or the SD ROOT if that folder is missing;
-- "LOG <rows>" climbs live; RTN shows a verified LOG SAVED / SAVE FAILED box.
--
-- FIELD SEQUENCE (hand launch, belly land, into wind):
--   1. Radio on, battery in, wait for sats. Arm.
--   2. Open SYS -> Tools -> glideslope. Choose AUTOMATIC or MANUAL heading
--      (MANUAL: dial in your launch heading, ENTER to confirm). Standing at
--      your launch/landing spot, the tool grabs that spot as home + baro
--      datum. Confirm "LOG" climbing.
--   3. Launch into wind (SD up). AUTOMATIC: climb-out auto-locks heading
--      (beep). MANUAL: heading is already set, nothing to wait for.
--   4. Fly. On final flip SD DOWN -> ILS needles. Center them, land.
--   5. RTN -> read the save box -> RTN. Disarm (separate).
--
-- Sensors: GPS, Alt = BARO (rename GPS-group Alt to GAlt), Hdg, GSpd + more.

local DEFAULT_DEG      = 3.0
local ILS_SW           = "sd"
local ILS_DOWN         = true
local MOVE_KMH         = 10
local MOVE_DEBOUNCE_MS = 400   -- GSpd must stay above MOVE_KMH this long before auto-lock
local HEADING_STEP     = 5     -- degrees per wheel click in manual mode
local GV_INDEX         = 8
local LAT_FS           = 40
local VERT_FS          = 20
local DEG2M            = 111320.0
local LOG_MS           = 100
local HEADING_FILE     = "/SCRIPTS/TOOLS/glideslope_heading.txt"
local COMPASS          = {"N","NE","E","SE","S","SW","W","NW"}

local slope = DEFAULT_DEG
local homeSet, headingSet, testMode = false, false, false
local thLat, thLon, thAlt, thHdgRad = 0,0,0,0

local flightMode = "auto"       -- "auto" or "manual", chosen on the setup screen
local manualHeadingDeg = 0
local moveAboveSinceMs = nil    -- debounce timer for automatic heading lock
local hdgSamples = {}           -- Hdg readings collected during the debounce window

local state = "mode"            -- "mode" -> ["heading"] -> "run" -> "done"
local path, writeOK, savedOK = nil, false, false
local rows, buffer, lastFlush, lastLog = 0, "", 0, 0

local function rad(d) return d * math.pi / 180 end
local function nowMs() return getTime() * 10 end
local function clamp(v, lo, hi)
  if v < lo then return lo elseif v > hi then return hi end
  return v
end

local function ilsVisible()
  local v = getValue(ILS_SW) or 0
  if ILS_DOWN then return v > 0 else return v < 0 end
end

local function loadSlope()
  local ok, g = pcall(model.getGlobalVariable, GV_INDEX, 0)
  if ok and g and g > 0 then slope = g / 10.0 else slope = DEFAULT_DEG end
end
local function saveSlope()
  pcall(model.setGlobalVariable, GV_INDEX, 0, math.floor(slope * 10 + 0.5))
end

-- Manual heading persists in its own file on the SD card (not a model global
-- variable) so it can never collide with global variables you already use
-- for mixing -- failure to read/write it is silently harmless, it just
-- means the manual heading resets to 0 (North) next time.
local function loadManualHeading()
  local ok, fh = pcall(io.open, HEADING_FILE, "r")
  if ok and fh then
    local ok2, line = pcall(io.read, fh, 10)
    pcall(io.close, fh)
    if ok2 and line then
      local n = tonumber(line)
      if n then manualHeadingDeg = math.floor(n + 0.5) % 360 end
    end
  end
end
local function saveManualHeading()
  local ok, fh = pcall(io.open, HEADING_FILE, "w")
  if ok and fh then
    pcall(io.write, fh, tostring(manualHeadingDeg))
    pcall(io.close, fh)
  end
end

local function compassLabel(deg)
  local idx = math.floor((deg / 45) + 0.5) % 8 + 1
  return COMPASS[idx]
end

local function getGPS()
  local g = getValue("GPS")
  if type(g) == "table" and g.lat ~= 0 then return g.lat, g.lon end
  return nil, nil
end

local function fmtn(name)
  local v = getValue(name)
  if v == nil then return "" end
  if type(v) == "number" then return string.format("%.3f", v) end
  return tostring(v)
end

-- Portable two-argument atan2, built from single-argument math.atan (present
-- in every Lua dialect) rather than depending on math.atan2 or a two-arg
-- math.atan overload -- either could be missing depending on the Lua version
-- EdgeTX's interpreter implements.
local function atan2(y, x)
  if x > 0 then return math.atan(y / x)
  elseif x < 0 and y >= 0 then return math.atan(y / x) + math.pi
  elseif x < 0 and y < 0 then return math.atan(y / x) - math.pi
  elseif x == 0 and y > 0 then return math.pi / 2
  elseif x == 0 and y < 0 then return -math.pi / 2
  else return 0 end
end

-- Locks the centerline heading. In automatic mode, `samples` is the list of
-- Hdg readings collected while GSpd was confirmed above MOVE_KMH for
-- MOVE_DEBOUNCE_MS -- averaged with a circular mean (not a plain arithmetic
-- mean, which breaks near the 0/360 wrap) so a single noisy reading right at
-- the GSpd threshold crossing -- e.g. the instant of a hard hand-launch
-- throw -- can't skew the locked heading on its own.
local function lockHeading(samples)
  if samples and #samples > 0 then
    local sx, sy = 0, 0
    for _, hd in ipairs(samples) do
      local r = rad(hd)
      sx = sx + math.cos(r)
      sy = sy + math.sin(r)
    end
    thHdgRad = atan2(sy, sx)
  else
    thHdgRad = rad(getValue("Hdg") or 0)
  end
  headingSet = true
end

local function solve()
  local lat, lon = getGPS()
  if lat == nil then return nil end
  local north = (lat - thLat) * DEG2M
  local east  = (lon - thLon) * DEG2M * math.cos(rad(thLat))
  local hx, hy = math.sin(thHdgRad), math.cos(thHdgRad)
  local dist  = -(east*hx + north*hy)
  local cross = east*hy - north*hx
  local h     = getValue("Alt") - thAlt
  local tgt   = (dist > 0) and (dist * math.tan(rad(slope))) or 0
  return dist, cross, h - tgt, h, tgt
end

-- ---- logging ----
local function tryWrite(p, text)
  local fh = io.open(p, "a")
  if fh then io.write(fh, text) io.close(fh) return true end
  return false
end
local function fileExists(p)
  local fh = io.open(p, "r")
  if fh then io.close(fh) return true end
  return false
end
local function flush()
  if buffer == "" then return end
  if tryWrite(path, buffer) then writeOK = true; buffer = "" else writeOK = false end
end
local function openLog()
  local dt = getDateTime()
  local fn = string.format("glideslope_%02d%02d_%02d%02d%02d.csv",
                           dt.mon, dt.day, dt.hour, dt.min, dt.sec)
  local hdr = "ms,lat,lon,alt,galt,gspd,hdg,vspd,sats,ptch,roll,yaw,home,hdgset,dist,cross,vdev,h,tgt\n"
  path = "/LOGS/" .. fn
  if tryWrite(path, hdr) then writeOK = true
  else path = "/" .. fn; writeOK = tryWrite(path, hdr) end
end
local function logRow(dist, cross, vdev, h, tgt)
  local lat, lon = getGPS()
  local ll = lat and string.format("%.6f,%.6f", lat, lon) or ","
  local comp = headingSet and dist and
    string.format("%.1f,%.1f,%.1f,%.1f,%.1f", dist, cross, vdev, h, tgt) or ",,,,"
  buffer = buffer .. string.format("%d,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%d,%d,%s\n",
    nowMs(), ll, fmtn("Alt"), fmtn("GAlt"), fmtn("GSpd"), fmtn("Hdg"),
    fmtn("VSpd"), fmtn("Sats"), fmtn("Ptch"), fmtn("Roll"), fmtn("Yaw"),
    homeSet and 1 or 0, headingSet and 1 or 0, comp)
  rows = rows + 1
end

-- ---- drawing ----
local function drawCDI(cross, vdev)
  local cx, cy, MAX = 130, 140, 65
  lcd.drawLine(cx-MAX, cy, cx+MAX, cy, DOTTED, WHITE)
  lcd.drawLine(cx, cy-MAX, cx, cy+MAX, DOTTED, WHITE)
  for _, o in ipairs({-MAX*0.66, -MAX*0.33, MAX*0.33, MAX*0.66}) do
    lcd.drawFilledRectangle(cx+o-1, cy-1, 3, 3, WHITE)
    lcd.drawFilledRectangle(cx-1, cy+o-1, 3, 3, WHITE)
  end
  lcd.drawFilledRectangle(cx-2, cy-2, 5, 5, RED)
  local dx = clamp(-cross/LAT_FS, -1, 1) * MAX
  lcd.drawLine(cx+dx, cy-MAX, cx+dx, cy+MAX, SOLID, GREEN)
  local dy = clamp(vdev/VERT_FS, -1, 1) * MAX
  lcd.drawLine(cx-MAX, cy+dy, cx+MAX, cy+dy, SOLID, GREEN)
end

local function drawConfirm()
  lcd.clear(BLACK)
  if savedOK then
    lcd.drawText(20, 30, "LOG SAVED", DBLSIZE + GREEN)
    lcd.drawText(20, 120, "Verified present on card.", SMLSIZE + WHITE)
  else
    lcd.drawText(20, 30, "SAVE FAILED", DBLSIZE + RED)
    lcd.drawText(20, 120, "File NOT found -- re-check card!", SMLSIZE + WHITE)
  end
  lcd.drawText(20, 80,  "File: " .. (path or "?"), SMLSIZE + WHITE)
  lcd.drawText(20, 100, "Rows: " .. rows, SMLSIZE + WHITE)
  lcd.drawText(20, 160, "Press RTN / ENTER to exit", SMLSIZE + WHITE)
end

local function drawModeSelect()
  lcd.clear(BLACK)
  lcd.drawText(20, 15, "GLIDESLOPE SETUP", DBLSIZE + WHITE)
  lcd.drawText(20, 60, "Flight path heading:", MIDSIZE + WHITE)
  local autoMark = (flightMode == "auto") and "> " or "  "
  local manMark  = (flightMode == "manual") and "> " or "  "
  lcd.drawText(30, 95,  autoMark .. "AUTOMATIC", MIDSIZE + (flightMode == "auto" and GREEN or WHITE))
  lcd.drawText(30, 125, manMark .. "MANUAL", MIDSIZE + (flightMode == "manual" and GREEN or WHITE))
  lcd.drawText(20, 165, "Automatic: locks heading from GPS", SMLSIZE + WHITE)
  lcd.drawText(20, 183, "during into-wind climb-out.", SMLSIZE + WHITE)
  lcd.drawText(20, 205, "Manual: you set the runway heading --", SMLSIZE + WHITE)
  lcd.drawText(20, 223, "use this for hand launches.", SMLSIZE + WHITE)
  lcd.drawText(20, 250, "wheel=select   ENT=confirm   RTN=exit", SMLSIZE + WHITE)
end

local function drawHeadingSelect()
  lcd.clear(BLACK)
  lcd.drawText(20, 15, "SET RUNWAY HEADING", DBLSIZE + WHITE)
  lcd.drawText(60, 80, string.format("%03d", manualHeadingDeg), DBLSIZE + GREEN)
  lcd.drawText(170, 90, compassLabel(manualHeadingDeg), MIDSIZE + WHITE)
  lcd.drawText(20, 150, "Direction you fly AWAY from home", SMLSIZE + WHITE)
  lcd.drawText(20, 168, "on climb-out (into wind).", SMLSIZE + WHITE)
  lcd.drawText(20, 250, "wheel=adjust  ENT=confirm  RTN=back", SMLSIZE + WHITE)
end

local function init()
  loadSlope()
  pcall(function() return model.getInfo().name end)
  openLog()
  lastFlush = nowMs()
  lastLog = nowMs()
end

local function run(event)
  if state == "done" then
    if event == EVT_VIRTUAL_ENTER or event == EVT_VIRTUAL_EXIT then return 1 end
    drawConfirm()
    return 0
  end

  -- ---- background tracking: runs every frame in every state so home
  -- capture and logging start immediately, exactly as before, regardless of
  -- how long you spend on the setup screens below ----

  if not homeSet then
    local lat, lon = getGPS()
    if lat ~= nil then
      thLat, thLon, thAlt = lat, lon, getValue("Alt")
      homeSet = true
      playTone(1500, 120, 0)
    end
  end

  if state == "run" and flightMode == "auto" and homeSet and not headingSet then
    local gspd = getValue("GSpd") or 0
    if gspd > MOVE_KMH then
      if moveAboveSinceMs == nil then
        moveAboveSinceMs = nowMs()
        hdgSamples = {}
      end
      table.insert(hdgSamples, getValue("Hdg") or 0)
      if nowMs() - moveAboveSinceMs >= MOVE_DEBOUNCE_MS then
        lockHeading(hdgSamples)
        playTone(2000, 120, 0)
      end
    else
      moveAboveSinceMs = nil
    end
  end

  local dist, cross, vdev, h, tgt
  if homeSet and headingSet then dist, cross, vdev, h, tgt = solve() end

  local t = nowMs()
  if t - lastLog >= LOG_MS then logRow(dist, cross, vdev, h, tgt); lastLog = t end
  if t - lastFlush > 1000 then flush(); lastFlush = t end

  -- ---- setup screens ----
  if state == "mode" then
    if event == EVT_VIRTUAL_INC or event == EVT_VIRTUAL_DEC then
      flightMode = (flightMode == "auto") and "manual" or "auto"
    end
    if event == EVT_VIRTUAL_ENTER then
      if flightMode == "manual" then
        loadManualHeading()
        state = "heading"
      else
        state = "run"
      end
    end
    if event == EVT_VIRTUAL_EXIT then
      flush()
      savedOK = fileExists(path)
      state = "done"
      drawConfirm()
      return 0
    end
    drawModeSelect()
    return 0
  end

  if state == "heading" then
    if event == EVT_VIRTUAL_INC then manualHeadingDeg = (manualHeadingDeg + HEADING_STEP) % 360 end
    if event == EVT_VIRTUAL_DEC then manualHeadingDeg = (manualHeadingDeg - HEADING_STEP + 360) % 360 end
    if event == EVT_VIRTUAL_EXIT then state = "mode"; return 0 end
    if event == EVT_VIRTUAL_ENTER then
      saveManualHeading()
      thHdgRad = rad(manualHeadingDeg)
      headingSet = true
      state = "run"
    end
    drawHeadingSelect()
    return 0
  end

  -- ---- state == "run": flight screen ----
  if event == EVT_VIRTUAL_EXIT then
    flush()
    savedOK = fileExists(path)
    state = "done"
    drawConfirm()
    return 0
  end

  -- ENTER = bench test, automatic mode only: lock heading to current
  -- direction and show ILS now. In manual mode heading is already fixed, so
  -- ENTER does nothing here -- it can't silently override your dialed-in
  -- runway heading.
  if event == EVT_VIRTUAL_ENTER and flightMode == "auto" then
    lockHeading()
    testMode = true
    playTone(2500, 120, 0)
  end
  if event == EVT_VIRTUAL_INC then slope = clamp(slope + 0.5, 2.0, 8.0); saveSlope() end
  if event == EVT_VIRTUAL_DEC then slope = clamp(slope - 0.5, 2.0, 8.0); saveSlope() end

  lcd.clear(BLACK)
  lcd.drawText(2, 2, string.format("GlideSlope %.1fdeg  wheel=adj", slope), SMLSIZE + WHITE)
  if testMode then lcd.drawText(210, 2, "TEST", SMLSIZE + RED) end
  local logst = writeOK and ("LOG "..rows) or "WRITE FAIL"
  lcd.drawText(320, 2, logst, SMLSIZE + (writeOK and WHITE or RED))

  if not homeSet then
    lcd.drawText(2, 130, "waiting for GPS lock...", MIDSIZE + RED)
    lcd.drawText(2, 258, "need GPS fix to set home", SMLSIZE + WHITE)
    return 0
  end

  local showILS = testMode or (ilsVisible() and headingSet)
  if showILS and headingSet then
    if dist == nil then lcd.drawText(2, 130, "GPS lost", DBLSIZE + RED); return 0 end
    drawCDI(cross, vdev)
    local x = 285
    lcd.drawText(x, 40,  string.format("Dist %5.0fm", dist), SMLSIZE + WHITE)
    lcd.drawText(x, 60,  string.format("Lat  %4.0fm %s", math.abs(cross), (cross>=0) and "R" or "L"), SMLSIZE + WHITE)
    lcd.drawText(x, 80,  string.format("Vert %4.0fm %s", math.abs(vdev), (vdev>=0) and "HIGH" or "LOW"), SMLSIZE + WHITE)
    lcd.drawText(x, 105, string.format("Alt  %5.0fm", h), SMLSIZE + WHITE)
    lcd.drawText(x, 125, string.format("Tgt  %5.0fm", tgt), SMLSIZE + WHITE)
    if dist <= 0 then lcd.drawText(x, 150, "PAST TARGET", SMLSIZE + RED) end
  else
    lcd.drawText(2, 105, "Home set." .. (headingSet and " Heading locked." or ""), SMLSIZE + WHITE)
    if not headingSet then
      lcd.drawText(2, 130, string.format("Climb out into wind (GSpd %.0f)", getValue("GSpd") or 0), MIDSIZE + WHITE)
      lcd.drawText(2, 158, "or press ENTER to bench test", SMLSIZE + WHITE)
    else
      lcd.drawText(2, 135, "Flip SD DOWN on final for ILS", MIDSIZE + WHITE)
    end
  end
  lcd.drawText(2, 258, "RTN=save+exit  ENT=test  SD=ILS", SMLSIZE + WHITE)
  return 0
end

return { init = init, run = run }
