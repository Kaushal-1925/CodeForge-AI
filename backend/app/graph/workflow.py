from langgraph.graph import END, START, StateGraph

from app.agents.architect import architect_agent
from app.agents.manager import manager_agent
from app.graph.state import CodeForgeState


def build_graph():
    graph = StateGraph(CodeForgeState)

    graph.add_node("manager", manager_agent)
    graph.add_node("architect", architect_agent)

    graph.add_edge(START, "manager")
    graph.add_edge("manager", "architect")
    graph.add_edge("architect", END)

    return graph.compile()