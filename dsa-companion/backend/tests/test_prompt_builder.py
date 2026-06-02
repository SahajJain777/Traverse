"""Tests for the prompt builder — text file loading and interpolation."""

import os
import tempfile

import pytest

from services.prompt_builder import (
    load_prompt,
    build_analysis_prompt,
    build_hint_prompt,
    build_goal_check_prompt,
    build_optimal_prompt,
    build_visual_prompt,
)

from config import PROMPTS_DIR


class TestLoadPrompt:
    def test_loads_existing_file(self):
        content = load_prompt("approach_analyser.txt")
        assert "{{PROBLEM}}" in content
        assert "{{ATTEMPT}}" in content
        assert "{{LANGUAGE}}" in content
        assert len(content) > 100

    def test_loads_all_prompt_files(self):
        filenames = [
            "approach_analyser.txt",
            "hint_tier_1.txt",
            "hint_tier_2.txt",
            "hint_tier_3.txt",
            "goal_reached_check.txt",
            "optimal_explainer.txt",
            "visual_generator.txt",
        ]
        for name in filenames:
            content = load_prompt(name)
            assert len(content) > 50, f"{name} is too short or missing"

    def test_raises_on_missing_file(self):
        with pytest.raises(FileNotFoundError):
            load_prompt("nonexistent.txt")


class TestBuildAnalysisPrompt:
    def test_interpolates_all_placeholders(self):
        result = build_analysis_prompt("problem p", "code c", "python")
        assert "problem p" in result
        assert "code c" in result
        assert "python" in result
        assert "{{PROBLEM}}" not in result
        assert "{{ATTEMPT}}" not in result
        assert "{{LANGUAGE}}" not in result


class TestBuildHintPrompt:
    def test_interpolates_tier_1(self):
        result = build_hint_prompt(
            1, "problem", "code", "java", {"key": "val"}, "history text"
        )
        assert "problem" in result
        assert "java" in result
        assert "val" in result
        # Tier 1 does NOT include {{HISTORY}}
        assert "{{HISTORY}}" not in result

    def test_interpolates_tier_2_with_history(self):
        result = build_hint_prompt(
            2, "p", "c", "cpp", {}, "past conversation"
        )
        assert "past conversation" in result
        assert "{{HISTORY}}" not in result

    def test_interpolates_tier_3_with_history(self):
        result = build_hint_prompt(
            3, "p", "c", "python", {}, "more history"
        )
        assert "more history" in result

    def test_invalid_tier_raises(self):
        with pytest.raises(ValueError, match="Invalid hint tier"):
            build_hint_prompt(4, "p", "c", "py", {}, "h")


class TestBuildGoalCheckPrompt:
    def test_interpolates_all_placeholders(self):
        result = build_goal_check_prompt("problem p", "code c", "java", "intent text")
        assert "problem p" in result
        assert "code c" in result
        assert "java" in result
        assert "intent text" in result
        assert "{{STUDENT_INTENT}}" not in result


class TestBuildOptimalPrompt:
    def test_interpolates_all_placeholders(self):
        result = build_optimal_prompt("problem p", "solution s", "python")
        assert "problem p" in result
        assert "solution s" in result
        assert "python" in result
        assert "{{SOLUTION}}" not in result


class TestBuildVisualPrompt:
    def test_interpolates_all_placeholders(self):
        result = build_visual_prompt("problem p", "Hash Map", "cpp")
        assert "problem p" in result
        assert "Hash Map" in result
        assert "cpp" in result
        assert "{{ALGORITHM_NAME}}" not in result
