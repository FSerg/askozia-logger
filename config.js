module.exports = {

  "agi_port": process.env.AGI_PORT,
  "agi_host": process.env.AGI_HOST,
  "agi_login": process.env.AGI_LOGIN,
  "agi_pass": process.env.AGI_PASS,

  "influx_host": process.env.INFLUX_HOST,
  "influx_port": process.env.INFLUX_PORT || 8086,
  "influx_user": process.env.INFLUX_USER,
  "influx_pass": process.env.INFLUX_PASS,
  "influx_db": process.env.INFLUX_DB

};
