use linked_list_allocator::LockedHeap;

pub const HEAP_SIZE: usize = 1024 * 1024; // 1 MiB
static mut HEAP_SPACE: [u8; HEAP_SIZE] = [0; HEAP_SIZE];

pub static ALLOCATOR: LockedHeap = LockedHeap::empty();

pub fn init_heap() {
    unsafe {
        ALLOCATOR
            .lock()
            .init(HEAP_SPACE.as_mut_ptr(), HEAP_SIZE);
    }
}

pub fn alloc_example() -> Box<u64> {
    Box::new(42)
}
