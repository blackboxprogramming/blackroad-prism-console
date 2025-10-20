#![no_std]
#![no_main]

use core::fmt::Write;
use core::panic::PanicInfo;
use core::panic::PanicInfo;
use core::fmt::Write;
use spin::Mutex;
use uart_16550::SerialPort;

static SERIAL1: Mutex<SerialPort> = Mutex::new(unsafe { SerialPort::new(0x3F8) });

pub fn serial_init() {
    SERIAL1.lock().init();
}

#[macro_export]
macro_rules! serial_println {
    ($($arg:tt)*) => {
        $crate::serial::_println(format_args!($($arg)*));
    };
}

pub mod serial {
    use super::SERIAL1;
    use core::fmt::{self, Write};
    use core::fmt::{self, Write};
    use super::SERIAL1;

    pub fn _println(args: fmt::Arguments) {
        let mut serial = SERIAL1.lock();
        serial.write_fmt(args).unwrap();
        serial.write_str("\n").unwrap();
    }
}

#[no_mangle]
pub extern "C" fn _start() -> ! {
    serial_init();
    serial_println!("PrismOS Lucidia Kernel Booting…");
    loop {}
}

#[panic_handler]
fn panic(info: &PanicInfo) -> ! {
    serial_println!("KERNEL PANIC: {:?}", info);
    loop {}
}
