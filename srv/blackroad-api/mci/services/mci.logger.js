module.exports = {
  log: (info) => {
    try {
      console.log(JSON.stringify(info));
    } catch (err) {
      console.log('mci_logger_error', err);
    }
  }
};
