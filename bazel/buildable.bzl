def _buildable_impl(ctx):
    # Retrieve the file specified by the build_file attribute.
    build_file = ctx.file.build_file
    if build_file == None:
        fail("Build file not found: {}".format(ctx.attr.build_file))

    # Create a no-op action that depends on the file so that Bazel
    # will ensure its existence at analysis time.
    ctx.actions.do_nothing(inputs = [build_file])

    return []

buildable = rule(
    implementation = _buildable_impl,
    attrs = {
        "build_file": attr.label(
            doc = "File that should exist to mark a directory buildable.",
            allow_single_file = True,
            mandatory = True,
        ),
    },
)
