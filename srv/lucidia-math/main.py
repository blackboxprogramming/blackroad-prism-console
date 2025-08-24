"""CLI entry point for the Infinity Math system."""
from logic import save_example as save_logic
from primes import generate_plot
from proofs import save_contradiction
from fractals import generate_mandelbrot

MENU = {
    "1": ("Generate truth table", save_logic),
    "2": ("Plot primes", generate_plot),
    "3": ("Save contradiction", save_contradiction),
    "4": ("Render Mandelbrot", generate_mandelbrot),
}


def main():
    print("Infinity Math demo")
    for key, (label, _) in MENU.items():
        print(f"{key}. {label}")
    choice = input("Choose an option: ")
    func = MENU.get(choice, (None, None))[1]
    if func:
        path = func()
        print(f"Generated {path}")
    else:
        print("No action chosen")


if __name__ == "__main__":
    main()
