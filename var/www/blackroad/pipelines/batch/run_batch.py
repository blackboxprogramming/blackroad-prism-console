import argparse
from pathlib import Path

def process_file(input_path: Path, output_path: Path) -> None:
    text = input_path.read_text()
    output_path.write_text(text.upper())

def main() -> None:
    parser = argparse.ArgumentParser(description="Batch inference pipeline")
    parser.add_argument("--input", type=Path, required=True, help="Input directory")
    parser.add_argument("--output", type=Path, required=True, help="Output directory")
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    for file in args.input.glob("*.txt"):
        out_file = args.output / file.name
        process_file(file, out_file)

if __name__ == "__main__":
    main()
